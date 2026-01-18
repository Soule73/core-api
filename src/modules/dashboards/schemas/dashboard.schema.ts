import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DashboardDocument = Dashboard & Document;

@Schema({ _id: false })
export class DashboardLayoutItem {
  @Prop({ required: true })
  i!: string;

  @Prop({ required: true })
  widgetId!: string;

  @Prop({ required: true })
  x!: number;

  @Prop({ required: true })
  y!: number;

  @Prop({ required: true })
  w!: number;

  @Prop({ required: true })
  h!: number;

  @Prop()
  minW?: number;

  @Prop()
  minH?: number;

  @Prop()
  maxW?: number;

  @Prop()
  maxH?: number;

  @Prop()
  static?: boolean;
}

@Schema({ _id: false })
export class DashboardTimeRange {
  @Prop()
  from?: Date;

  @Prop()
  to?: Date;

  @Prop()
  intervalValue?: number;

  @Prop()
  intervalUnit?: string;
}

@Schema({ _id: false })
export class DashboardHistoryItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ default: Date.now })
  date!: Date;

  @Prop({ enum: ['create', 'update', 'delete'], required: true })
  action!: string;

  @Prop({ type: Object })
  changes?: Record<string, unknown>;
}

@Schema({ timestamps: true })
export class Dashboard {
  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ type: [raw(DashboardLayoutItem)], default: [] })
  layout!: DashboardLayoutItem[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ enum: ['public', 'private'], default: 'private' })
  visibility!: string;

  @Prop({ type: [raw(DashboardHistoryItem)], default: [] })
  history!: DashboardHistoryItem[];

  @Prop({ default: false })
  shareEnabled!: boolean;

  @Prop({ default: null })
  shareId?: string;

  @Prop()
  autoRefreshIntervalValue?: number;

  @Prop()
  autoRefreshIntervalUnit?: string;

  @Prop({ type: raw(DashboardTimeRange) })
  timeRange?: DashboardTimeRange;
}

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);
