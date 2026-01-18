import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WidgetDocument = Widget & Document;

@Schema({ _id: false })
export class WidgetHistoryItem {
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
export class Widget {
  @Prop({ required: true, unique: true })
  widgetId!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  type!: string;

  @Prop({ type: Types.ObjectId, ref: 'DataSource', required: true })
  dataSourceId!: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  config!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ enum: ['public', 'private'], default: 'private' })
  visibility!: string;

  @Prop({ type: [raw(WidgetHistoryItem)], default: [] })
  history!: WidgetHistoryItem[];

  @Prop({ default: false })
  isGeneratedByAI!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'AIConversation' })
  conversationId?: Types.ObjectId;

  @Prop({ default: false })
  isDraft!: boolean;

  @Prop()
  description?: string;

  @Prop()
  reasoning?: string;

  @Prop({ min: 0, max: 1 })
  confidence?: number;
}

export const WidgetSchema = SchemaFactory.createForClass(Widget);
