import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DataSource, DataSourceDocument } from './schemas/datasource.schema';
import { CreateDataSourceDto, UpdateDataSourceDto } from './dto';
import { DataSourceResponse } from './interfaces';
import { WidgetsService } from '../widgets/widgets.service';
import { EncryptionService } from '../../common/services/encryption.service';

@Injectable()
export class DataSourcesService {
  constructor(
    @InjectModel(DataSource.name)
    private dataSourceModel: Model<DataSourceDocument>,
    private readonly widgetsService: WidgetsService,
    private readonly encryptionService: EncryptionService,
  ) {
    /** */
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

    await this.dataSourceModel.findByIdAndDelete(id);
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
  private decryptAuthConfig(
    authType: string,
    authConfig: Record<string, string>,
  ): Record<string, string> {
    const result = { ...authConfig };
    const fieldsToDecrypt: Record<string, string[]> = {
      bearer: ['token'],
      apiKey: ['key', 'apiKey'],
      basic: ['password'],
    };
    const fields = fieldsToDecrypt[authType] ?? [];
    for (const field of fields) {
      if (typeof result[field] === 'string' && result[field].length > 0) {
        try {
          result[field] = this.encryptionService.decrypt(result[field]);
        } catch {
          // Field may not be encrypted (legacy data), return as-is
        }
      }
    }
    return result;
  }

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
