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
import { AIConversationResponse } from './interfaces';

@Injectable()
export class AIConversationsService {
  constructor(
    @InjectModel(AIConversation.name)
    private aiConversationModel: Model<AIConversationDocument>,
  ) {}

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
    };
  }
}
