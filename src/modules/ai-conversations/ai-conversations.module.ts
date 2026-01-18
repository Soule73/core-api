import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIConversationsController } from './ai-conversations.controller';
import { AIConversationsService } from './ai-conversations.service';
import {
  AIConversation,
  AIConversationSchema,
} from './schemas/ai-conversation.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIConversation.name, schema: AIConversationSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [AIConversationsController],
  providers: [AIConversationsService],
  exports: [AIConversationsService],
})
export class AIConversationsModule {}
