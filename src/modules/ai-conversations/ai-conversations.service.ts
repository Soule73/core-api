import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  AIConversation,
  AIConversationDocument,
} from './schemas/ai-conversation.schema';
import {
  CreateAIConversationDto,
  UpdateAIConversationDto,
  AddMessageDto,
} from './dto';
import {
  AIConversationResponse,
  GeneratedWidgetSummaryResponse,
} from './interfaces';

@Injectable()
export class AIConversationsService {
  constructor(
    @InjectModel(AIConversation.name)
    private aiConversationModel: Model<AIConversationDocument>,
  ) {
    //
  }

  async create(
    userId: string,
    createDto: CreateAIConversationDto,
  ): Promise<AIConversationResponse> {
    const conversation = await this.aiConversationModel.create({
      userId: new Types.ObjectId(userId),
      dataSourceId: new Types.ObjectId(createDto.dataSourceId),
      title: createDto.title,
      messages: (createDto.messages || []).map((m) => ({
        ...m,
        timestamp: new Date(),
      })),
    });

    return this.buildConversationResponse(conversation);
  }

  async findAll(userId: string): Promise<AIConversationResponse[]> {
    const conversations = await this.aiConversationModel.find({
      userId: new Types.ObjectId(userId),
    });

    return conversations.map((c) => this.buildConversationResponse(c));
  }

  async findByDataSource(
    dataSourceId: string,
    userId: string,
  ): Promise<AIConversationResponse[]> {
    const conversations = await this.aiConversationModel.find({
      userId: new Types.ObjectId(userId),
      dataSourceId: new Types.ObjectId(dataSourceId),
    });

    return conversations.map((c) => this.buildConversationResponse(c));
  }

  async findOne(id: string, userId: string): Promise<AIConversationResponse> {
    const conversation = await this.aiConversationModel.findById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return this.buildConversationResponse(conversation);
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateAIConversationDto,
  ): Promise<AIConversationResponse> {
    const conversation = await this.aiConversationModel.findById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    const updatedConversation =
      await this.aiConversationModel.findByIdAndUpdate(id, updateDto, {
        new: true,
      });

    return this.buildConversationResponse(updatedConversation!);
  }

  async addMessage(
    id: string,
    userId: string,
    addMessageDto: AddMessageDto,
  ): Promise<AIConversationResponse> {
    const conversation = await this.aiConversationModel.findById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    const updatedConversation =
      await this.aiConversationModel.findByIdAndUpdate(
        id,
        {
          $push: {
            messages: {
              ...addMessageDto,
              timestamp: new Date(),
            },
          },
        },
        { new: true },
      );

    return this.buildConversationResponse(updatedConversation!);
  }

  async remove(id: string, userId: string): Promise<void> {
    const conversation = await this.aiConversationModel.findById(id);

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (conversation.userId.toString() !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    await this.aiConversationModel.findByIdAndDelete(id);
  }

  /**
   * Upserts widget summaries in the conversation's generatedWidgets array.
   * Existing entries with the same widgetId are replaced to avoid duplicates.
   * Ownership is enforced atomically — throws NotFoundException if the conversation
   * does not exist or is not owned by the user.
   *
   * @param id - Conversation ID
   * @param userId - Owner user ID
   * @param widgetSummaries - Summaries to upsert (created or updated this turn)
   */
  async appendGeneratedWidgets(
    id: string,
    userId: string,
    widgetSummaries: GeneratedWidgetSummaryResponse[],
  ): Promise<void> {
    const widgetObjectIds = widgetSummaries.map(
      (w) => new Types.ObjectId(w.widgetId),
    );

    const pullResult = await this.aiConversationModel.updateOne(
      { _id: id, userId: new Types.ObjectId(userId) },
      { $pull: { generatedWidgets: { widgetId: { $in: widgetObjectIds } } } },
    );

    if (pullResult.matchedCount === 0) {
      throw new NotFoundException('Conversation not found');
    }

    await this.aiConversationModel.updateOne(
      { _id: id, userId: new Types.ObjectId(userId) },
      {
        $push: {
          generatedWidgets: {
            $each: widgetSummaries.map((w) => ({
              widgetId: new Types.ObjectId(w.widgetId),
              type: w.type,
              title: w.title,
              config: w.config,
            })),
          },
        },
      },
    );
  }

  private buildConversationResponse(
    conversation: AIConversationDocument,
  ): AIConversationResponse {
    return {
      _id: conversation._id.toString(),
      id: conversation._id.toString(),
      userId: conversation.userId.toString(),
      dataSourceId: conversation.dataSourceId.toString(),
      title: conversation.title,
      messages: conversation.messages || [],
      dataSourceSummary: conversation.dataSourceSummary,
      suggestions: conversation.suggestions,
      generatedWidgets: (conversation.generatedWidgets || []).map((w) => ({
        widgetId: w.widgetId.toString(),
        type: w.type,
        title: w.title,
        config: w.config,
      })),
    };
  }
}
