import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Permission } from './permission.schema';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], required: true })
  permissions: Types.ObjectId[] | Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);
