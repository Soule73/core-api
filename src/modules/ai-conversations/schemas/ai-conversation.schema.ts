import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AIConversationDocument = AIConversation & Document;

@Schema({ _id: false })
export class AIMessage {
  @Prop({ enum: ['user', 'assistant'], required: true })
  role!: string;

  @Prop({ required: true })
  content!: string;

  @Prop({ default: Date.now })
  timestamp!: Date;

  @Prop()
  widgetsGenerated?: number;
}

@Schema({ _id: false })
export class ColumnSummary {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  uniqueValues?: number;

  @Prop({ type: [Object] })
  sampleValues?: unknown[];
}

@Schema({ _id: false })
export class DataSourceSummary {
  @Prop({ required: true })
  totalRows!: number;

  @Prop({ type: [raw(ColumnSummary)] })
  columns!: ColumnSummary[];
}

@Schema({ timestamps: true })
export class AIConversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'DataSource',
    required: true,
    index: true,
  })
  dataSourceId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ type: [raw(AIMessage)], default: [] })
  messages!: AIMessage[];

  @Prop({ type: raw(DataSourceSummary) })
  dataSourceSummary?: DataSourceSummary;

  @Prop({ type: [String] })
  suggestions?: string[];
}

export const AIConversationSchema =
  SchemaFactory.createForClass(AIConversation);
