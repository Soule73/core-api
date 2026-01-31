import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { Dashboard } from './schemas/dashboard.schema';
import { WidgetsService } from '../widgets/widgets.service';
import { Types } from 'mongoose';

const mockUserId = '507f1f77bcf86cd799439011';
const mockDashboardId = '507f1f77bcf86cd799439012';
const mockShareId = 'share-uuid-123';

const mockDashboard = {
  _id: new Types.ObjectId(mockDashboardId),
  title: 'Test Dashboard',
  description: 'Test description',
  visibility: 'private',
  ownerId: new Types.ObjectId(mockUserId),
  layout: [],
  shareEnabled: false,
  shareId: null,
  history: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDashboardModel = {
  find: vi.fn(),
  findOne: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

const mockWidgetsService = {
  findOne: vi.fn(),
  findByDataSource: vi.fn(),
};

describe('DashboardsService', () => {
  let service: DashboardsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardsService,
        {
          provide: getModelToken(Dashboard.name),
          useValue: mockDashboardModel,
        },
        {
          provide: WidgetsService,
          useValue: mockWidgetsService,
        },
      ],
    }).compile();

    service = module.get<DashboardsService>(DashboardsService);
  });

  describe('create', () => {
    it('should create a new dashboard successfully', async () => {
      mockDashboardModel.create.mockResolvedValue(mockDashboard);

      const result = await service.create(mockUserId, {
        title: 'Test Dashboard',
        visibility: 'private',
      });

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Dashboard');
      expect(mockDashboardModel.create).toHaveBeenCalled();
    });

    it('should validate widgets exist before creating dashboard', async () => {
      const widgetId = new Types.ObjectId().toString();
      const mockWidgetDoc = {
        _id: new Types.ObjectId(widgetId),
        title: 'Test Widget',
      };

      mockWidgetsService.findOne.mockResolvedValue(mockWidgetDoc);
      mockDashboardModel.create.mockResolvedValue({
        ...mockDashboard,
        layout: [
          {
            i: 'item1',
            widgetId: new Types.ObjectId(widgetId),
            x: 0,
            y: 0,
            w: 4,
            h: 2,
          },
        ],
      });

      const result = await service.create(mockUserId, {
        title: 'Test Dashboard',
        visibility: 'private',
        layout: [{ i: 'item1', widgetId, x: 0, y: 0, w: 4, h: 2 }],
      });

      expect(mockWidgetsService.findOne).toHaveBeenCalledWith(
        widgetId,
        mockUserId,
      );
      expect(result).toHaveProperty('_id');
    });

    it('should throw BadRequestException if widget does not exist', async () => {
      const widgetId = new Types.ObjectId().toString();
      mockWidgetsService.findOne.mockResolvedValue(null);

      await expect(
        service.create(mockUserId, {
          title: 'Test Dashboard',
          visibility: 'private',
          layout: [{ i: 'item1', widgetId, x: 0, y: 0, w: 4, h: 2 }],
        }),
      ).rejects.toThrow('The following widgets do not exist');
    });
  });

  describe('findAll', () => {
    it('should return dashboards for user', async () => {
      mockDashboardModel.find.mockResolvedValue([mockDashboard]);

      const result = await service.findAll(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a dashboard by id for owner', async () => {
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);

      const result = await service.findOne(mockDashboardId, mockUserId);

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Dashboard');
    });

    it('should throw NotFoundException if dashboard not found', async () => {
      mockDashboardModel.findById.mockResolvedValue(null);

      await expect(service.findOne('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-owner on private dashboard', async () => {
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);

      await expect(
        service.findOne(mockDashboardId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow access to public dashboard for non-owner', async () => {
      const publicDashboard = { ...mockDashboard, visibility: 'public' };
      mockDashboardModel.findById.mockResolvedValue(publicDashboard);

      const result = await service.findOne(mockDashboardId, 'otherUserId');

      expect(result.visibility).toBe('public');
    });
  });

  describe('findByShareId', () => {
    it('should return shared dashboard', async () => {
      const sharedDashboard = {
        ...mockDashboard,
        shareEnabled: true,
        shareId: mockShareId,
      };
      mockDashboardModel.findOne.mockResolvedValue(sharedDashboard);

      const result = await service.findByShareId(mockShareId);

      expect(result).toHaveProperty('shareId', mockShareId);
    });

    it('should throw NotFoundException if share not found', async () => {
      mockDashboardModel.findOne.mockResolvedValue(null);

      await expect(service.findByShareId('invalidShareId')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a dashboard successfully', async () => {
      const updatedDashboard = { ...mockDashboard, title: 'Updated Title' };
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);
      mockDashboardModel.findByIdAndUpdate.mockResolvedValue(updatedDashboard);

      const result = await service.update(mockDashboardId, mockUserId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should validate widgets when layout is updated', async () => {
      const widgetId = new Types.ObjectId().toString();
      const mockWidgetDoc = {
        _id: new Types.ObjectId(widgetId),
        title: 'Test Widget',
      };

      mockWidgetsService.findOne.mockResolvedValue(mockWidgetDoc);
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);
      mockDashboardModel.findByIdAndUpdate.mockResolvedValue({
        ...mockDashboard,
        layout: [
          {
            i: 'item1',
            widgetId: new Types.ObjectId(widgetId),
            x: 0,
            y: 0,
            w: 4,
            h: 2,
          },
        ],
      });

      const result = await service.update(mockDashboardId, mockUserId, {
        layout: [{ i: 'item1', widgetId, x: 0, y: 0, w: 4, h: 2 }],
      });

      expect(mockWidgetsService.findOne).toHaveBeenCalledWith(
        widgetId,
        mockUserId,
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if dashboard not found', async () => {
      mockDashboardModel.findById.mockResolvedValue(null);

      await expect(
        service.update('invalidId', mockUserId, { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);

      await expect(
        service.update(mockDashboardId, 'otherUserId', { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleShare', () => {
    it('should enable sharing', async () => {
      const sharedDashboard = {
        ...mockDashboard,
        shareEnabled: true,
        shareId: 'new-share-id',
      };
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);
      mockDashboardModel.findByIdAndUpdate.mockResolvedValue(sharedDashboard);

      const result = await service.toggleShare(mockDashboardId, mockUserId);

      expect(result.shareEnabled).toBe(true);
      expect(result.shareId).toBeDefined();
    });

    it('should disable sharing', async () => {
      const enabledDashboard = {
        ...mockDashboard,
        shareEnabled: true,
        shareId: mockShareId,
      };
      const disabledDashboard = {
        ...mockDashboard,
        shareEnabled: false,
        shareId: null,
      };
      mockDashboardModel.findById.mockResolvedValue(enabledDashboard);
      mockDashboardModel.findByIdAndUpdate.mockResolvedValue(disabledDashboard);

      const result = await service.toggleShare(mockDashboardId, mockUserId);

      expect(result.shareEnabled).toBe(false);
    });
  });

  describe('remove', () => {
    it('should delete a dashboard successfully', async () => {
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);
      mockDashboardModel.findByIdAndDelete.mockResolvedValue(mockDashboard);

      await expect(
        service.remove(mockDashboardId, mockUserId),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if dashboard not found', async () => {
      mockDashboardModel.findById.mockResolvedValue(null);

      await expect(service.remove('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if not owner', async () => {
      mockDashboardModel.findById.mockResolvedValue(mockDashboard);

      await expect(
        service.remove(mockDashboardId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findDashboardsUsingWidget', () => {
    it('should find dashboards using a specific widget (ObjectId)', async () => {
      const widgetId = new Types.ObjectId().toString();
      const dashboardWithWidget = {
        ...mockDashboard,
        layout: [
          {
            i: 'item1',
            widgetId: new Types.ObjectId(widgetId),
            x: 0,
            y: 0,
            w: 4,
            h: 2,
          },
        ],
      };

      mockDashboardModel.find.mockResolvedValue([dashboardWithWidget]);

      const result = await service.findDashboardsUsingWidget(
        widgetId,
        mockUserId,
      );

      expect(result).toHaveLength(1);
      expect(mockDashboardModel.find).toHaveBeenCalledWith({
        $or: [
          { 'layout.widgetId': widgetId },
          { 'layout.widgetId': new Types.ObjectId(widgetId) },
        ],
        ownerId: new Types.ObjectId(mockUserId),
      });
    });

    it('should return empty array if no dashboards use the widget', async () => {
      mockDashboardModel.find.mockResolvedValue([]);

      const result = await service.findDashboardsUsingWidget(
        'nonexistent',
        mockUserId,
      );

      expect(result).toHaveLength(0);
    });
  });
});
