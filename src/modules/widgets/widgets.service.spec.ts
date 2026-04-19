import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { WidgetsService } from './widgets.service';
import { Widget } from './schemas/widget.schema';
import { DashboardsService } from '../dashboards/dashboards.service';
import { Types } from 'mongoose';

const mockUserId = '507f1f77bcf86cd799439011';
const mockWidgetId = '507f1f77bcf86cd799439012';
const mockDataSourceId = '507f1f77bcf86cd799439013';

const mockWidget = {
  _id: new Types.ObjectId(mockWidgetId),
  title: 'Test Widget',
  type: 'bar',
  dataSourceId: new Types.ObjectId(mockDataSourceId),
  ownerId: new Types.ObjectId(mockUserId),
  visibility: 'private',
  config: { metrics: [], buckets: [] },
  history: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWidgetModel = {
  find: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const mockDashboardsService = {
  findDashboardsUsingWidget: vi.fn(),
};

describe('WidgetsService', () => {
  let service: WidgetsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WidgetsService,
        { provide: getModelToken(Widget.name), useValue: mockWidgetModel },
        {
          provide: DashboardsService,
          useValue: mockDashboardsService,
        },
      ],
    }).compile();

    service = module.get<WidgetsService>(WidgetsService);
  });

  describe('create', () => {
    it('should create a new widget successfully', async () => {
      mockWidgetModel.create.mockResolvedValue(mockWidget);

      const result = await service.create(mockUserId, {
        title: 'Test Widget',
        type: 'bar',
        dataSourceId: mockDataSourceId,
        config: { metrics: [], buckets: [] },
      });

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Widget');
      expect(result.type).toBe('bar');
      expect(mockWidgetModel.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return widgets for user', async () => {
      mockWidgetModel.find.mockResolvedValue([mockWidget]);

      const result = await service.findAll(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findByDataSource', () => {
    it('should return widgets for a specific data source', async () => {
      mockWidgetModel.find.mockResolvedValue([mockWidget]);

      const result = await service.findByDataSource(
        mockDataSourceId,
        mockUserId,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a widget by id for owner', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);

      const result = await service.findOne(mockWidgetId, mockUserId);

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Widget');
    });

    it('should throw NotFoundException for invalid ObjectId', async () => {
      await expect(service.findOne('invalid-id', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if widget not found', async () => {
      mockWidgetModel.findById.mockResolvedValue(null);

      await expect(service.findOne(mockWidgetId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-owner on private widget', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);

      await expect(
        service.findOne(mockWidgetId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow access to public widget for non-owner', async () => {
      const publicWidget = { ...mockWidget, visibility: 'public' };
      mockWidgetModel.findById.mockResolvedValue(publicWidget);

      const result = await service.findOne(mockWidgetId, 'otherUserId');

      expect(result.visibility).toBe('public');
    });
  });

  describe('update', () => {
    it('should update a widget successfully', async () => {
      const updatedWidget = { ...mockWidget, title: 'Updated Widget' };
      mockWidgetModel.findById.mockResolvedValue(mockWidget);
      mockWidgetModel.findByIdAndUpdate.mockResolvedValue(updatedWidget);

      const result = await service.update(mockWidgetId, mockUserId, {
        title: 'Updated Widget',
      });

      expect(result.title).toBe('Updated Widget');
    });

    it('should throw NotFoundException if widget not found', async () => {
      mockWidgetModel.findById.mockResolvedValue(null);

      await expect(
        service.update('507f1f77bcf86cd799439099', mockUserId, {
          title: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);

      await expect(
        service.update(mockWidgetId, 'otherUserId', { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a widget successfully when not used', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);
      mockDashboardsService.findDashboardsUsingWidget.mockResolvedValue([]);
      mockWidgetModel.findByIdAndDelete.mockResolvedValue(mockWidget);

      await expect(
        service.remove(mockWidgetId, mockUserId),
      ).resolves.not.toThrow();

      expect(
        mockDashboardsService.findDashboardsUsingWidget,
      ).toHaveBeenCalledWith(mockWidgetId, mockUserId);
    });

    it('should throw BadRequestException if widget is used in dashboards', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);
      mockDashboardsService.findDashboardsUsingWidget.mockResolvedValue([
        { _id: '1', title: 'Dashboard 1' },
        { _id: '2', title: 'Dashboard 2' },
      ]);

      await expect(service.remove(mockWidgetId, mockUserId)).rejects.toThrow(
        'Cannot delete widget',
      );

      expect(mockWidgetModel.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if widget not found', async () => {
      mockWidgetModel.findById.mockResolvedValue(null);

      await expect(
        service.remove('507f1f77bcf86cd799439099', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockWidgetModel.findById.mockResolvedValue(mockWidget);

      await expect(service.remove(mockWidgetId, 'otherUserId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
