import { describe, it, expect, beforeAll } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { BaseE2ETest } from '@e2e/base';
import { Response } from 'supertest';
import { AIConversationResponse } from '@core/modules/ai-conversations';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

interface CreateConversationPayload {
  dataSourceId: string;
  title: string;
  messages?: Array<{ role: string; content: string }>;
}

interface AddMessagePayload {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * E2E test class for AI Conversations module.
 * Tests conversation CRUD and message operations.
 */
class AIConversationsE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/ai/conversations';
  private userDataSourceId = '';
  private adminDataSourceId = '';
  private createdConversationId = '';
  private adminConversationId = '';

  setUserDataSourceId(id: string): void {
    this.userDataSourceId = id;
  }

  getUserDataSourceId(): string {
    return this.userDataSourceId;
  }

  setAdminDataSourceId(id: string): void {
    this.adminDataSourceId = id;
  }

  getAdminDataSourceId(): string {
    return this.adminDataSourceId;
  }

  setCreatedConversationId(id: string): void {
    this.createdConversationId = id;
  }

  getCreatedConversationId(): string {
    return this.createdConversationId;
  }

  setAdminConversationId(id: string): void {
    this.adminConversationId = id;
  }

  getAdminConversationId(): string {
    return this.adminConversationId;
  }

  getDataSourceModel(): Model<DataSourceDoc> {
    return this.context.app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );
  }

  createConversation(
    data: CreateConversationPayload,
    asAdmin = false,
  ): Promise<Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      {
        asAdmin,
      },
    );
  }

  createConversationWithoutAuth(
    data: Partial<CreateConversationPayload>,
  ): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }

  getAllConversations(asAdmin = false): Promise<Response> {
    return this.get(this.basePath, { asAdmin });
  }

  getConversationsByDataSource(
    dataSourceId: string,
    asAdmin = false,
  ): Promise<Response> {
    return this.get(`${this.basePath}?dataSourceId=${dataSourceId}`, {
      asAdmin,
    });
  }

  getConversationById(id: string, asAdmin = false): Promise<Response> {
    return this.get(`${this.basePath}/${id}`, { asAdmin });
  }

  addMessage(
    conversationId: string,
    data: AddMessagePayload,
    asAdmin = false,
  ): Promise<Response> {
    return this.post(
      `${this.basePath}/${conversationId}/messages`,
      data as unknown as Record<string, unknown>,
      {
        asAdmin,
      },
    );
  }

  updateConversation(
    id: string,
    data: Record<string, unknown>,
    asAdmin = false,
  ): Promise<Response> {
    return this.put(`${this.basePath}/${id}`, data, { asAdmin });
  }

  deleteConversation(id: string, asAdmin = false): Promise<Response> {
    return this.delete(`${this.basePath}/${id}`, { asAdmin });
  }
}

const test = new AIConversationsE2ETest();

describe('AI Conversations Module (E2E)', () => {
  beforeAll(async () => {
    const DataSourceModel = test.getDataSourceModel();

    const userDs = await DataSourceModel.create({
      name: 'User AI Source',
      type: 'json',
      endpoint: 'https://api.test.com/ai-user',
      ownerId: test.testData.regularUser._id,
    });
    test.setUserDataSourceId(String(userDs._id));

    const adminDs = await DataSourceModel.create({
      name: 'Admin AI Source',
      type: 'json',
      endpoint: 'https://api.test.com/ai-admin',
      ownerId: test.testData.adminUser._id,
    });
    test.setAdminDataSourceId(String(adminDs._id));
  });

  describe('POST /api/v1/ai/conversations', () => {
    it('should create a conversation', async () => {
      const response = await test.createConversation({
        dataSourceId: test.getUserDataSourceId(),
        title: 'Create a bar chart showing sales by region',
      });

      expect(response.status).toBe(201);
      const body = response.body as AIConversationResponse;
      expect(body).toHaveProperty('dataSourceId', test.getUserDataSourceId());
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('messages');
      test.setCreatedConversationId(body._id);
    });

    it('should create conversation with initial messages', async () => {
      const response = await test.createConversation(
        {
          dataSourceId: test.getAdminDataSourceId(),
          title: 'Analyze sales trends',
          messages: [
            { role: 'user', content: 'Show me sales trends' },
            {
              role: 'assistant',
              content: 'Here are the recommended visualizations...',
            },
          ],
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as AIConversationResponse;
      expect(body.messages).toHaveLength(2);
      test.setAdminConversationId(body._id);
    });

    it('should fail without dataSourceId', async () => {
      const response = await test.post(
        '/api/v1/ai/conversations',
        { title: 'Missing data source' },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await test.createConversationWithoutAuth({
        dataSourceId: test.getUserDataSourceId(),
        title: 'Unauthorized conversation',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/ai/conversations', () => {
    it('should get user conversations', async () => {
      const response = await test.getAllConversations();

      expect(response.status).toBe(200);
      const body = response.body as AIConversationResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter conversations by dataSourceId', async () => {
      const response = await test.getConversationsByDataSource(
        test.getUserDataSourceId(),
      );

      expect(response.status).toBe(200);
      const body = response.body as AIConversationResponse[];
      expect(Array.isArray(body)).toBe(true);
      body.forEach((conv) => {
        expect(conv.dataSourceId).toBe(test.getUserDataSourceId());
      });
    });

    it('should not include other user conversations', async () => {
      const response = await test.getAllConversations();

      expect(response.status).toBe(200);
      const body = response.body as AIConversationResponse[];
      const adminConv = body.find(
        (c) => c._id === test.getAdminConversationId(),
      );
      expect(adminConv).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      const response = await test.get('/api/v1/ai/conversations', {
        useAuth: false,
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/ai/conversations/:id', () => {
    it('should get own conversation', async () => {
      const response = await test.getConversationById(
        test.getCreatedConversationId(),
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        '_id',
        test.getCreatedConversationId(),
      );
      expect(response.body).toHaveProperty('title');
    });

    it('should fail to get other user conversation', async () => {
      const response = await test.getConversationById(
        test.getAdminConversationId(),
      );

      expect(response.status).toBe(404);
    });

    it('should return 404 for non-existent conversation', async () => {
      const response = await test.getConversationById(
        '507f1f77bcf86cd799439011',
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/v1/ai/conversations/:id/messages', () => {
    it('should add a user message to conversation', async () => {
      const response = await test.addMessage(test.getCreatedConversationId(), {
        role: 'user',
        content: 'Can you make the chart blue?',
      });

      expect(response.status).toBe(201);
      const body = response.body as AIConversationResponse;
      expect(body.messages.length).toBeGreaterThan(0);
      const lastMessage = body.messages[body.messages.length - 1];
      expect(lastMessage).toHaveProperty('role', 'user');
      expect(lastMessage).toHaveProperty(
        'content',
        'Can you make the chart blue?',
      );
    });

    it('should add an assistant message', async () => {
      const response = await test.addMessage(test.getCreatedConversationId(), {
        role: 'assistant',
        content: 'I have updated the chart to blue.',
      });

      expect(response.status).toBe(201);
      const body = response.body as AIConversationResponse;
      const lastMessage = body.messages[body.messages.length - 1];
      expect(lastMessage).toHaveProperty('role', 'assistant');
    });

    it('should fail to add message to other user conversation', async () => {
      const response = await test.addMessage(test.getAdminConversationId(), {
        role: 'user',
        content: 'Hacking attempt',
      });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/ai/conversations/:id', () => {
    it('should update conversation title', async () => {
      const response = await test.updateConversation(
        test.getCreatedConversationId(),
        { title: 'Updated: Create a blue bar chart showing sales by region' },
      );

      expect(response.status).toBe(200);
      const body = response.body as AIConversationResponse;
      expect(body.title).toContain('Updated:');
    });

    it('should fail to update other user conversation', async () => {
      const response = await test.updateConversation(
        test.getAdminConversationId(),
        { title: 'Hacked title' },
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/ai/conversations/:id', () => {
    it('should fail to delete other user conversation', async () => {
      const response = await test.deleteConversation(
        test.getAdminConversationId(),
      );

      expect(response.status).toBe(404);
    });

    it('should delete own conversation', async () => {
      const response = await test.deleteConversation(
        test.getCreatedConversationId(),
      );

      expect(response.status).toBe(204);
    });

    it('should return 404 for already deleted conversation', async () => {
      const response = await test.getConversationById(
        test.getCreatedConversationId(),
      );

      expect(response.status).toBe(404);
    });
  });
});
