import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Widget, WidgetDocument } from './schemas/widget.schema';
import { CreateWidgetDto, UpdateWidgetDto } from './dto';
import { WidgetResponse } from './interfaces';
import { DashboardsService } from '../dashboards/dashboards.service';

@Injectable()
export class WidgetsService {
  constructor(
    @InjectModel(Widget.name) private widgetModel: Model<WidgetDocument>,
    @Inject(forwardRef(() => DashboardsService))
    private readonly dashboardsService: DashboardsService,
  ) {
    /** */
  }

  async create(
    userId: string,
    createWidgetDto: CreateWidgetDto,
  ): Promise<WidgetResponse> {
    const widget = await this.widgetModel.create({
      ...createWidgetDto,
      widgetId: uuidv4(),
      dataSourceId: new Types.ObjectId(createWidgetDto.dataSourceId),
      conversationId: createWidgetDto.conversationId
        ? new Types.ObjectId(createWidgetDto.conversationId)
        : undefined,
      ownerId: new Types.ObjectId(userId),
      history: [
        {
          userId: new Types.ObjectId(userId),
          action: 'create',
          date: new Date(),
        },
      ],
    });

    return this.buildWidgetResponse(widget);
  }

  async findAll(userId: string): Promise<WidgetResponse[]> {
    const widgets = await this.widgetModel.find({
      $or: [{ ownerId: new Types.ObjectId(userId) }, { visibility: 'public' }],
    });

    return widgets.map((w) => this.buildWidgetResponse(w));
  }

  async findByDataSource(
    dataSourceId: string,
    userId: string,
  ): Promise<WidgetResponse[]> {
    const widgets = await this.widgetModel.find({
      dataSourceId: new Types.ObjectId(dataSourceId),
      $or: [{ ownerId: new Types.ObjectId(userId) }, { visibility: 'public' }],
    });

    return widgets.map((w) => this.buildWidgetResponse(w));
  }

  async findOne(id: string, userId: string): Promise<WidgetResponse> {
    const widget = await this.widgetModel.findOne({
      $or: [{ _id: id }, { widgetId: id }],
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    if (
      widget.ownerId.toString() !== userId &&
      widget.visibility !== 'public'
    ) {
      throw new NotFoundException('Widget not found');
    }

    return this.buildWidgetResponse(widget);
  }

  async update(
    id: string,
    userId: string,
    updateWidgetDto: UpdateWidgetDto,
  ): Promise<WidgetResponse> {
    const widget = await this.widgetModel.findOne({
      $or: [{ _id: id }, { widgetId: id }],
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    if (widget.ownerId.toString() !== userId) {
      throw new NotFoundException('Widget not found');
    }

    const updateData: Record<string, unknown> = { ...updateWidgetDto };
    if (updateWidgetDto.dataSourceId) {
      updateData.dataSourceId = new Types.ObjectId(
        updateWidgetDto.dataSourceId,
      );
    }

    const updatedWidget = await this.widgetModel.findByIdAndUpdate(
      widget._id,
      {
        ...updateData,
        $push: {
          history: {
            userId: new Types.ObjectId(userId),
            action: 'update',
            date: new Date(),
            changes: updateWidgetDto,
          },
        },
      },
      { new: true },
    );

    return this.buildWidgetResponse(updatedWidget!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const widget = await this.widgetModel.findOne({
      $or: [{ _id: id }, { widgetId: id }],
    });

    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    if (widget.ownerId.toString() !== userId) {
      throw new NotFoundException('Widget not found');
    }

    // Check if widget is used in dashboards
    // Use widget._id (not widget.widgetId) because layout.widgetId stores ObjectId references
    const dashboardsUsing =
      await this.dashboardsService.findDashboardsUsingWidget(
        widget._id.toString(),
        userId,
      );

    if (dashboardsUsing.length > 0) {
      const dashboardTitles = dashboardsUsing.map((d) => d.title).join(', ');
      throw new BadRequestException(
        `Cannot delete widget. It is used in ${dashboardsUsing.length} dashboard(s): ${dashboardTitles}`,
      );
    }

    await this.widgetModel.findByIdAndDelete(widget._id);
  }

  private buildWidgetResponse(widget: WidgetDocument): WidgetResponse {
    return {
      _id: widget._id.toString(),
      id: widget._id.toString(),
      widgetId: widget.widgetId,
      title: widget.title,
      type: widget.type,
      dataSourceId: widget.dataSourceId.toString(),
      config: widget.config || {},
      ownerId: widget.ownerId.toString(),
      visibility: widget.visibility,
      isGeneratedByAI: widget.isGeneratedByAI,
      conversationId: widget.conversationId?.toString(),
      isDraft: widget.isDraft,
      description: widget.description,
      reasoning: widget.reasoning,
      confidence: widget.confidence,
    };
  }
}
