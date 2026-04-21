import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';
import { CreateDashboardDto, UpdateDashboardDto } from './dto';
import { DashboardResponse } from './interfaces';
import { WidgetsService } from '../widgets/widgets.service';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(Dashboard.name)
    private dashboardModel: Model<DashboardDocument>,
    private readonly widgetsService: WidgetsService,
  ) {
    /** */
  }

  private async validateWidgetsExist(
    widgetIds: string[],
    userId: string,
  ): Promise<void> {
    if (!widgetIds || widgetIds.length === 0) {
      return;
    }

    const widgets = await Promise.all(
      widgetIds.map(async (widgetId) => {
        try {
          const widget = await this.widgetsService.findOne(widgetId, userId);
          return widget;
        } catch {
          return null;
        }
      }),
    );

    const missingWidgets: string[] = [];
    widgetIds.forEach((widgetId, index) => {
      if (!widgets[index]) {
        missingWidgets.push(widgetId);
      }
    });

    if (missingWidgets.length > 0) {
      throw new BadRequestException(
        `The following widgets do not exist or you don't have access: ${missingWidgets.join(', ')}`,
      );
    }
  }

  async create(
    userId: string,
    createDashboardDto: CreateDashboardDto,
  ): Promise<DashboardResponse> {
    const widgetIds =
      createDashboardDto.layout?.map((item) => item.widgetId) || [];

    if (!createDashboardDto.skipValidation) {
      await this.validateWidgetsExist(widgetIds, userId);
    }

    const layout = createDashboardDto.layout?.map((item) => ({
      ...item,
      widgetId: new Types.ObjectId(item.widgetId),
    }));

    // Exclude skipValidation from dashboard data (not in schema)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { skipValidation, ...dashboardData } = createDashboardDto;

    const dashboard = await this.dashboardModel.create({
      ...dashboardData,
      layout,
      ownerId: new Types.ObjectId(userId),
      history: [
        {
          userId: new Types.ObjectId(userId),
          action: 'create',
          date: new Date(),
        },
      ],
    });

    return this.buildDashboardResponse(dashboard);
  }

  async findAll(userId: string): Promise<DashboardResponse[]> {
    const dashboards = await this.dashboardModel.find({
      $or: [{ ownerId: new Types.ObjectId(userId) }, { visibility: 'public' }],
    });

    return dashboards.map((d) => this.buildDashboardResponse(d));
  }

  async findOne(id: string, userId: string): Promise<DashboardResponse> {
    const dashboard = await this.dashboardModel.findById(id);

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    if (
      dashboard.ownerId.toString() !== userId &&
      dashboard.visibility !== 'public'
    ) {
      throw new NotFoundException('Dashboard not found');
    }

    return this.buildDashboardResponse(dashboard);
  }

  async findByShareId(shareId: string): Promise<DashboardResponse> {
    const dashboard = await this.dashboardModel.findOne({
      shareId,
      shareEnabled: true,
    });

    if (!dashboard) {
      throw new NotFoundException('Shared dashboard not found');
    }

    return this.buildDashboardResponse(dashboard);
  }

  async update(
    id: string,
    userId: string,
    updateDashboardDto: UpdateDashboardDto,
  ): Promise<DashboardResponse> {
    const dashboard = await this.dashboardModel.findById(id);

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    if (dashboard.ownerId.toString() !== userId) {
      throw new NotFoundException('Dashboard not found');
    }

    if (updateDashboardDto.layout) {
      const widgetIds = updateDashboardDto.layout.map((item) => item.widgetId);
      await this.validateWidgetsExist(widgetIds, userId);
    }

    const layoutWithObjectId = updateDashboardDto.layout?.map((item) => ({
      ...item,
      widgetId: new Types.ObjectId(item.widgetId),
    }));

    const updatedDashboard = await this.dashboardModel.findByIdAndUpdate(
      id,
      {
        ...updateDashboardDto,
        ...(layoutWithObjectId && { layout: layoutWithObjectId }),
        $push: {
          history: {
            userId: new Types.ObjectId(userId),
            action: 'update',
            date: new Date(),
            changes: updateDashboardDto,
          },
        },
      },
      { new: true },
    );

    return this.buildDashboardResponse(updatedDashboard!);
  }

  async toggleShare(id: string, userId: string): Promise<DashboardResponse> {
    const dashboard = await this.dashboardModel.findById(id);

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    if (dashboard.ownerId.toString() !== userId) {
      throw new NotFoundException('Dashboard not found');
    }

    const shareEnabled = !dashboard.shareEnabled;
    const shareId = shareEnabled ? crypto.randomUUID() : null;

    const updatedDashboard = await this.dashboardModel.findByIdAndUpdate(
      id,
      { shareEnabled, shareId },
      { new: true },
    );

    return this.buildDashboardResponse(updatedDashboard!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const dashboard = await this.dashboardModel.findById(id);

    if (!dashboard) {
      throw new NotFoundException('Dashboard not found');
    }

    if (dashboard.ownerId.toString() !== userId) {
      throw new NotFoundException('Dashboard not found');
    }

    await this.dashboardModel.findByIdAndDelete(id);
  }

  async findDashboardsUsingWidget(
    widgetId: string,
    userId: string,
  ): Promise<DashboardResponse[]> {
    // Validate widgetId is a valid ObjectId
    if (!Types.ObjectId.isValid(widgetId)) {
      return [];
    }

    const dashboards = await this.dashboardModel.find({
      'layout.widgetId': new Types.ObjectId(widgetId),
      ownerId: new Types.ObjectId(userId),
    });

    return dashboards.map((d) => this.buildDashboardResponse(d));
  }

  private buildDashboardResponse(
    dashboard: DashboardDocument,
  ): DashboardResponse {
    const layout =
      dashboard.layout?.map((item) => ({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        widgetId: item.widgetId.toString(),
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
        static: item.static,
        styles: item.styles,
      })) || [];

    return {
      _id: dashboard._id.toString(),
      id: dashboard._id.toString(),
      title: dashboard.title,
      description: dashboard.description,
      layout,
      styles: dashboard.styles,
      ownerId: dashboard.ownerId.toString(),
      visibility: dashboard.visibility,
      shareEnabled: dashboard.shareEnabled,
      isShared: dashboard.shareEnabled,
      shareId: dashboard.shareId,
      autoRefreshIntervalValue: dashboard.autoRefreshIntervalValue,
      autoRefreshIntervalUnit: dashboard.autoRefreshIntervalUnit,
      timeRange: dashboard.timeRange,
      globalFilters: (dashboard.globalFilters || []).map((f) => ({
        id: f.id,
        field: f.field,
        operator: f.operator,
        value: f.value,
      })),
    };
  }
}
