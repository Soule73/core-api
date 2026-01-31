import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { DataSourcesService } from './datasources.service';
import { DataSource } from './schemas/datasource.schema';
import { WidgetsService } from '../widgets/widgets.service';
import { Types } from 'mongoose';

const mockUserId = '507f1f77bcf86cd799439011';
const mockDataSourceId = '507f1f77bcf86cd799439012';

const mockDataSource = {
  _id: new Types.ObjectId(mockDataSourceId),
  name: 'Test Source',
  type: 'json',
  endpoint: 'https://api.example.com/data',
  ownerId: new Types.ObjectId(mockUserId),
  visibility: 'private',
  config: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDataSourceModel = {
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const mockWidgetsService = {
  findByDataSource: vi.fn(),
};

describe('DataSourcesService', () => {
  let service: DataSourcesService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourcesService,
        {
          provide: getModelToken(DataSource.name),
          useValue: mockDataSourceModel,
        },
        {
          provide: WidgetsService,
          useValue: mockWidgetsService,
        },
      ],
    }).compile();

    service = module.get<DataSourcesService>(DataSourcesService);
  });

  describe('create', () => {
    it('should create a JSON data source', async () => {
      mockDataSourceModel.create.mockResolvedValue(mockDataSource);

      const result = await service.create(mockUserId, {
        name: 'Test Source',
        type: 'json',
        endpoint: 'https://api.example.com/data',
      });

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('Test Source');
      expect(result.type).toBe('json');
    });

    it('should create a CSV data source', async () => {
      const csvSource = {
        ...mockDataSource,
        type: 'csv',
        filePath: '/uploads/data.csv',
      };
      mockDataSourceModel.create.mockResolvedValue(csvSource);

      const result = await service.create(mockUserId, {
        name: 'CSV Source',
        type: 'csv',
        filePath: '/uploads/data.csv',
      });

      expect(result.type).toBe('csv');
    });

    it('should create an Elasticsearch data source', async () => {
      const esSource = {
        ...mockDataSource,
        type: 'elasticsearch',
        endpoint: 'http://localhost:9200',
        esIndex: 'logs-*',
      };
      mockDataSourceModel.create.mockResolvedValue(esSource);

      const result = await service.create(mockUserId, {
        name: 'ES Source',
        type: 'elasticsearch',
        endpoint: 'http://localhost:9200',
        esIndex: 'logs-*',
      });

      expect(result.type).toBe('elasticsearch');
    });
  });

  describe('findAll', () => {
    it('should return data sources for user', async () => {
      mockDataSourceModel.find.mockResolvedValue([mockDataSource]);

      const result = await service.findAll(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a data source by id for owner', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);

      const result = await service.findOne(mockDataSourceId, mockUserId);

      expect(result).toHaveProperty('_id');
      expect(result.name).toBe('Test Source');
    });

    it('should throw NotFoundException if data source not found', async () => {
      mockDataSourceModel.findById.mockResolvedValue(null);

      await expect(service.findOne('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-owner on private data source', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);

      await expect(
        service.findOne(mockDataSourceId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow access to public data source for non-owner', async () => {
      const publicSource = { ...mockDataSource, visibility: 'public' };
      mockDataSourceModel.findById.mockResolvedValue(publicSource);

      const result = await service.findOne(mockDataSourceId, 'otherUserId');

      expect(result.visibility).toBe('public');
    });
  });

  describe('update', () => {
    it('should update a data source successfully', async () => {
      const updatedSource = { ...mockDataSource, name: 'Updated Source' };
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);
      mockDataSourceModel.findByIdAndUpdate.mockResolvedValue(updatedSource);

      const result = await service.update(mockDataSourceId, mockUserId, {
        name: 'Updated Source',
      });

      expect(result.name).toBe('Updated Source');
    });

    it('should throw NotFoundException if data source not found', async () => {
      mockDataSourceModel.findById.mockResolvedValue(null);

      await expect(
        service.update('invalidId', mockUserId, { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);

      await expect(
        service.update(mockDataSourceId, 'otherUserId', { name: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a data source successfully when not used', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);
      mockWidgetsService.findByDataSource.mockResolvedValue([]);
      mockDataSourceModel.findByIdAndDelete.mockResolvedValue(mockDataSource);

      await expect(
        service.remove(mockDataSourceId, mockUserId),
      ).resolves.not.toThrow();

      expect(mockWidgetsService.findByDataSource).toHaveBeenCalledWith(
        mockDataSourceId,
        mockUserId,
      );
    });

    it('should throw BadRequestException if datasource is used by widgets', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);
      mockWidgetsService.findByDataSource.mockResolvedValue([
        { _id: '1', title: 'Widget 1' },
        { _id: '2', title: 'Widget 2' },
      ]);

      await expect(
        service.remove(mockDataSourceId, mockUserId),
      ).rejects.toThrow('Cannot delete data source');

      expect(mockDataSourceModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if data source not found', async () => {
      mockDataSourceModel.findById.mockResolvedValue(null);

      await expect(service.remove('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if not owner', async () => {
      mockDataSourceModel.findById.mockResolvedValue(mockDataSource);

      await expect(
        service.remove(mockDataSourceId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
