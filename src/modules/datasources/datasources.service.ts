import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DataSource, DataSourceDocument } from './schemas/datasource.schema';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto';
import { DataSourceResponse } from './interfaces';
import { WidgetsService } from '../widgets/widgets.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { R2StorageService } from '../../common/services/r2-storage.service';

interface UploadedCsvFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class DataSourcesService {
  private readonly logger = new Logger(DataSourcesService.name);

  constructor(
    @InjectModel(DataSource.name)
    private dataSourceModel: Model<DataSourceDocument>,
    private readonly widgetsService: WidgetsService,
    private readonly encryptionService: EncryptionService,
    private readonly r2StorageService: R2StorageService,
  ) {
    /** */
  }

  async createFromCsvUpload(
    userId: string,
    file: UploadedCsvFile,
    name?: string,
  ): Promise<DataSourceResponse> {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    const validMimeTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    const isCsvByMime = validMimeTypes.includes(file.mimetype);
    const isCsvByName = file.originalname.toLowerCase().endsWith('.csv');
    if (!isCsvByMime && !isCsvByName) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const sanitizedName = this.sanitizeFileName(file.originalname);
    const objectKey = `csv/${userId}/${Date.now()}-${sanitizedName}`;

    let filePath = objectKey;
    let storageType: 'local' | 'r2' = 'local';

    if (this.r2StorageService.isConfigured) {
      await this.r2StorageService.upload(objectKey, file.buffer, 'text/csv');
      storageType = 'r2';
    } else {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      const absolutePath = path.resolve(uploadsDir, objectKey);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, file.buffer);
      filePath = objectKey;
      this.logger.warn('R2 not configured, CSV stored locally in uploads directory');
    }

    const dataSource = await this.dataSourceModel.create({
      name: (name || file.originalname.replace(/\.csv$/i, '')).trim(),
      type: 'csv',
      filePath,
      ownerId: new Types.ObjectId(userId),
      visibility: 'private',
      authType: 'none',
      authConfig: {},
      config: {},
      storageType,
    });

    return this.buildDataSourceResponse(dataSource);
  }

  async create(
    userId: string,
    createDataSourceDto: CreateDataSourceDto,
  ): Promise<DataSourceResponse> {
    const encryptedAuthConfig = this.encryptAuthConfig(
      createDataSourceDto.authType ?? 'none',
      (createDataSourceDto.authConfig ?? {}) as Record<string, string>,
    );
    const dataSource = await this.dataSourceModel.create({
      ...createDataSourceDto,
      authConfig: encryptedAuthConfig,
      ownerId: new Types.ObjectId(userId),
    });

    return this.buildDataSourceResponse(dataSource);
  }

  async findAll(userId: string): Promise<DataSourceResponse[]> {
    const dataSources = await this.dataSourceModel.find({
      $or: [{ ownerId: new Types.ObjectId(userId) }, { visibility: 'public' }],
    });

    return dataSources.map((ds) => this.buildDataSourceResponse(ds));
  }

  async findOne(id: string, userId: string): Promise<DataSourceResponse> {
    const dataSource = await this.dataSourceModel.findById(id);

    if (!dataSource) {
      throw new NotFoundException('DataSource not found');
    }

    if (
      dataSource.ownerId.toString() !== userId &&
      dataSource.visibility !== 'public'
    ) {
      throw new NotFoundException('DataSource not found');
    }

    return this.buildDataSourceResponse(dataSource);
  }

  async update(
    id: string,
    userId: string,
    updateDataSourceDto: UpdateDataSourceDto,
  ): Promise<DataSourceResponse> {
    const dataSource = await this.dataSourceModel.findById(id);

    if (!dataSource) {
      throw new NotFoundException('DataSource not found');
    }

    if (dataSource.ownerId.toString() !== userId) {
      throw new NotFoundException('DataSource not found');
    }

    const updatePayload: Omit<UpdateDataSourceDto, 'authConfig'> & {
      authConfig?: Record<string, string>;
    } = {
      ...updateDataSourceDto,
      authConfig: updateDataSourceDto.authConfig as
        | Record<string, string>
        | undefined,
    };
    if (updateDataSourceDto.authConfig !== undefined) {
      updatePayload.authConfig = this.encryptAuthConfig(
        updateDataSourceDto.authType ?? dataSource.authType ?? 'none',
        updateDataSourceDto.authConfig as Record<string, string>,
      );
    }

    const updatedDataSource = await this.dataSourceModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true },
    );

    return this.buildDataSourceResponse(updatedDataSource!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const dataSource = await this.dataSourceModel.findById(id);

    if (!dataSource) {
      throw new NotFoundException('DataSource not found');
    }

    if (dataSource.ownerId.toString() !== userId) {
      throw new NotFoundException('DataSource not found');
    }

    // Vérifier si des widgets utilisent cette source
    const widgetsUsing = await this.widgetsService.findByDataSource(id, userId);

    if (widgetsUsing.length > 0) {
      const widgetTitles = widgetsUsing.map((w) => w.title).join(', ');
      throw new BadRequestException(
        `Cannot delete data source. It is used by ${widgetsUsing.length} widget(s): ${widgetTitles}`,
      );
    }

    if (dataSource.type === 'csv' && dataSource.filePath) {
      if (dataSource.storageType === 'r2') {
        if (this.r2StorageService.isConfigured) {
          await this.r2StorageService.delete(dataSource.filePath);
        } else {
          this.logger.warn(
            `R2 file deletion skipped because R2 is not configured: ${dataSource.filePath}`,
          );
        }
      } else {
        await this.deleteLocalCsvFile(dataSource.filePath);
      }
    }

    await this.dataSourceModel.findByIdAndDelete(id);
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private async deleteLocalCsvFile(filePath: string): Promise<void> {
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    const absolutePath = path.resolve(uploadsDir, filePath);
    if (
      !absolutePath.startsWith(uploadsDir + path.sep) &&
      absolutePath !== uploadsDir
    ) {
      this.logger.warn(`Skipping unsafe local file deletion path: ${filePath}`);
      return;
    }

    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      this.logger.warn(
        `Local CSV deletion failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Encrypts sensitive fields in authConfig before persisting to MongoDB.
   */
  private encryptAuthConfig(
    authType: string,
    authConfig: Record<string, string>,
  ): Record<string, string> {
    const result = { ...authConfig };
    const fieldsToEncrypt: Record<string, string[]> = {
      bearer: ['token'],
      apiKey: ['key', 'apiKey'],
      basic: ['password'],
    };
    const fields = fieldsToEncrypt[authType] ?? [];
    for (const field of fields) {
      if (typeof result[field] === 'string' && result[field].length > 0) {
        result[field] = this.encryptionService.encrypt(result[field]);
      }
    }
    return result;
  }

  /**
   * Decrypts sensitive fields from authConfig after reading from MongoDB.
   */
  private buildDataSourceResponse(
    dataSource: DataSourceDocument,
  ): DataSourceResponse {
    return {
      _id: dataSource._id.toString(),
      id: dataSource._id.toString(),
      name: dataSource.name,
      type: dataSource.type,
      endpoint: dataSource.endpoint,
      filePath: dataSource.filePath,
      storageType: dataSource.storageType,
      config: dataSource.config || {},
      ownerId: dataSource.ownerId.toString(),
      visibility: dataSource.visibility,
      timestampField: dataSource.timestampField,
      httpMethod: dataSource.httpMethod,
      authType: dataSource.authType,
      esIndex: dataSource.esIndex,
      createdAt: dataSource.createdAt?.toISOString(),
      updatedAt: dataSource.updatedAt?.toISOString(),
    };
  }
}
