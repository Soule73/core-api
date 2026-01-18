import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DataSourceDocument = DataSource & Document;

@Schema({ timestamps: true })
export class DataSource {
  @Prop({ required: true })
  name!: string;

  @Prop({ enum: ['json', 'csv', 'elasticsearch'], default: 'json' })
  type!: string;

  @Prop()
  endpoint?: string;

  @Prop()
  filePath?: string;

  @Prop({ type: Object, default: {} })
  config!: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId!: Types.ObjectId;

  @Prop({ enum: ['public', 'private'], default: 'private' })
  visibility!: string;

  @Prop()
  timestampField?: string;

  @Prop({ enum: ['GET', 'POST'], default: 'GET' })
  httpMethod!: string;

  @Prop({ enum: ['none', 'bearer', 'apiKey', 'basic'], default: 'none' })
  authType!: string;

  @Prop({ type: Object, default: {} })
  authConfig!: Record<string, unknown>;

  @Prop()
  esIndex?: string;

  @Prop({ type: Object })
  esQuery?: Record<string, unknown>;
}

export const DataSourceSchema = SchemaFactory.createForClass(DataSource);
