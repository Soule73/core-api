import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AIController } from './ai.controller';
import { AIService } from './ai.service';
import { PromptBuilderService } from './prompt-builder.service';
import { WidgetConfigValidatorService } from './widget-config-validator.service';
import { ProcessingModule } from '../processing/processing.module';
import { WidgetsModule } from '../widgets/widgets.module';
import { AIConversationsModule } from '../ai-conversations/ai-conversations.module';
import { DataSourcesModule } from '../datasources/datasources.module';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ProcessingModule,
    WidgetsModule,
    AIConversationsModule,
    DataSourcesModule,
    AuthModule,
  ],
  controllers: [AIController],
  providers: [AIService, PromptBuilderService, WidgetConfigValidatorService],
  exports: [AIService],
})
export class AIModule {
  /** */
}
