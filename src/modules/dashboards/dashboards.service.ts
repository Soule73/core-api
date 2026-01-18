import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';
import { CreateDashboardDto, UpdateDashboardDto } from './dto';
import { DashboardResponse } from './interfaces';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(Dashboard.name)
    private dashboardModel: Model<DashboardDocument>,
  ) {
    /** */
  }

  async create(
    userId: string,
    createDashboardDto: CreateDashboardDto,
  ): Promise<DashboardResponse> {
    const dashboard = await this.dashboardModel.create({
      ...createDashboardDto,
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

    const updateData = {
      ...updateDashboardDto,
      $push: {
        history: {
          userId: new Types.ObjectId(userId),
          action: 'update',
          date: new Date(),
          changes: updateDashboardDto,
        },
      },
    };

    const updatedDashboard = await this.dashboardModel.findByIdAndUpdate(
      id,
      updateData,
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
    const shareId = shareEnabled ? uuidv4() : null;

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

  private buildDashboardResponse(
    dashboard: DashboardDocument,
  ): DashboardResponse {
    return {
      _id: dashboard._id.toString(),
      id: dashboard._id.toString(),
      title: dashboard.title,
      description: dashboard.description,
      layout: dashboard.layout || [],
      ownerId: dashboard.ownerId.toString(),
      visibility: dashboard.visibility,
      shareEnabled: dashboard.shareEnabled,
      isShared: dashboard.shareEnabled,
      shareId: dashboard.shareId,
      autoRefreshIntervalValue: dashboard.autoRefreshIntervalValue,
      autoRefreshIntervalUnit: dashboard.autoRefreshIntervalUnit,
      timeRange: dashboard.timeRange,
    };
  }
}
