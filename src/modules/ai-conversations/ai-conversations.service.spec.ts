import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { AIConversationsService } from './ai-conversations.service';
import { AIConversation } from './schemas/ai-conversation.schema';
import { Types } from 'mongoose';

const mockUserId = '507f1f77bcf86cd799439011';
const mockConversationId = '507f1f77bcf86cd799439012';
const mockDataSourceId = '507f1f77bcf86cd799439013';

const mockConversation = {
  _id: new Types.ObjectId(mockConversationId),
  userId: new Types.ObjectId(mockUserId),
  dataSourceId: new Types.ObjectId(mockDataSourceId),
  title: 'Test Conversation',
  messages: [
    { role: 'user', content: 'Create a bar chart', timestamp: new Date() },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockConversationModel = {
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
};

describe('AIConversationsService', () => {
  let service: AIConversationsService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIConversationsService,
        {
          provide: getModelToken(AIConversation.name),
          useValue: mockConversationModel,
        },
      ],
    }).compile();

    service = module.get<AIConversationsService>(AIConversationsService);
  });

  describe('create', () => {
    it('should create a new conversation successfully', async () => {
      mockConversationModel.create.mockResolvedValue(mockConversation);

      const result = await service.create(mockUserId, {
        userId: mockUserId,
        dataSourceId: mockDataSourceId,
        title: 'Test Conversation',
      });

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Conversation');
      expect(result.userId.toString()).toBe(mockUserId);
      expect(mockConversationModel.create).toHaveBeenCalled();
    });

    it('should create conversation with initial messages', async () => {
      const conversationWithMessages = {
        ...mockConversation,
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }],
      };
      mockConversationModel.create.mockResolvedValue(conversationWithMessages);

      const result = await service.create(mockUserId, {
        userId: mockUserId,
        dataSourceId: mockDataSourceId,
        title: 'Test',
        messages: [{ role: 'user', content: 'Hello' }],
      });

      expect(result.messages.length).toBe(1);
    });
  });

  describe('findAll', () => {
    it('should return conversations for user', async () => {
      mockConversationModel.find.mockResolvedValue([mockConversation]);

      const result = await service.findAll(mockUserId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findByDataSource', () => {
    it('should return conversations for a specific data source', async () => {
      mockConversationModel.find.mockResolvedValue([mockConversation]);

      const result = await service.findByDataSource(
        mockDataSourceId,
        mockUserId,
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a conversation by id', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      const result = await service.findOne(mockConversationId, mockUserId);

      expect(result).toHaveProperty('_id');
      expect(result.title).toBe('Test Conversation');
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(service.findOne('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException for non-owner', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await expect(
        service.findOne(mockConversationId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a conversation successfully', async () => {
      const updatedConversation = {
        ...mockConversation,
        title: 'Updated Title',
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(
        updatedConversation,
      );

      const result = await service.update(mockConversationId, mockUserId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(
        service.update('invalidId', mockUserId, { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await expect(
        service.update(mockConversationId, 'otherUserId', { title: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMessage', () => {
    it('should add a message to conversation', async () => {
      const updatedConversation = {
        ...mockConversation,
        messages: [
          ...mockConversation.messages,
          {
            role: 'assistant',
            content: 'Here is your chart',
            timestamp: new Date(),
          },
        ],
      };
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockConversationModel.findByIdAndUpdate.mockResolvedValue(
        updatedConversation,
      );

      const result = await service.addMessage(mockConversationId, mockUserId, {
        role: 'assistant',
        content: 'Here is your chart',
      });

      expect(result.messages.length).toBe(2);
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(
        service.addMessage('invalidId', mockUserId, {
          role: 'user',
          content: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if not owner', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await expect(
        service.addMessage(mockConversationId, 'otherUserId', {
          role: 'user',
          content: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a conversation successfully', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);
      mockConversationModel.findByIdAndDelete.mockResolvedValue(
        mockConversation,
      );

      await expect(
        service.remove(mockConversationId, mockUserId),
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundException if conversation not found', async () => {
      mockConversationModel.findById.mockResolvedValue(null);

      await expect(service.remove('invalidId', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if not owner', async () => {
      mockConversationModel.findById.mockResolvedValue(mockConversation);

      await expect(
        service.remove(mockConversationId, 'otherUserId'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
