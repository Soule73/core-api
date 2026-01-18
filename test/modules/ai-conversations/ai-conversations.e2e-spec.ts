import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { createTestApp, closeTestApp } from '../../helpers';
import {
  seedTestData,
  cleanupTestData,
  type SeedData,
} from '../../helpers/test-data.helper';
import type {
  LoginResponse,
  AIConversationResponse,
} from '../../helpers/test-interfaces';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

describe('AI Conversations Module (E2E)', () => {
  let app: INestApplication;
  let seedData: SeedData;
  let adminToken: string;
  let userToken: string;
  let userDataSourceId: string;
  let adminDataSourceId: string;
  let createdConversationId: string;
  let adminConversationId: string;

  beforeAll(async () => {
    app = await createTestApp();
    seedData = await seedTestData(app);

    const adminLogin = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: seedData.adminUser.email,
        password: seedData.adminUser.password,
      });
    adminToken = (adminLogin.body as LoginResponse).token;

    const userLogin = await request(app.getHttpServer() as Server)
      .post('/api/v1/auth/login')
      .send({
        email: seedData.regularUser.email,
        password: seedData.regularUser.password,
      });
    userToken = (userLogin.body as LoginResponse).token;

    const DataSourceModel = app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );

    const userDs = await DataSourceModel.create({
      name: 'User AI Source',
      type: 'json',
      endpoint: 'https://api.test.com/ai-user',
      ownerId: seedData.regularUser._id,
    });
    userDataSourceId = String(userDs._id);

    const adminDs = await DataSourceModel.create({
      name: 'Admin AI Source',
      type: 'json',
      endpoint: 'https://api.test.com/ai-admin',
      ownerId: seedData.adminUser._id,
    });
    adminDataSourceId = String(adminDs._id);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await closeTestApp(app);
  });

  describe('POST /api/v1/ai/conversations', () => {
    it('should create a conversation', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          dataSourceId: userDataSourceId,
          title: 'Create a bar chart showing sales by region',
        })
        .expect(201);

      const body = response.body as AIConversationResponse;
      expect(body).toHaveProperty('dataSourceId', userDataSourceId);
      expect(body).toHaveProperty('title');
      expect(body).toHaveProperty('messages');
      createdConversationId = body._id;
    });

    it('should create conversation with initial messages', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dataSourceId: adminDataSourceId,
          title: 'Analyze sales trends',
          messages: [
            {
              role: 'user',
              content: 'Show me sales trends',
            },
            {
              role: 'assistant',
              content: 'Here are the recommended visualizations...',
            },
          ],
        })
        .expect(201);

      const body = response.body as AIConversationResponse;
      expect(body.messages).toHaveLength(2);
      adminConversationId = body._id;
    });

    it('should fail without dataSourceId', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Missing data source',
        })
        .expect(400);
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .post('/api/v1/ai/conversations')
        .send({
          dataSourceId: userDataSourceId,
          title: 'Unauthorized conversation',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/ai/conversations', () => {
    it('should get user conversations', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as AIConversationResponse[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter conversations by dataSourceId', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/ai/conversations?dataSourceId=${userDataSourceId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as AIConversationResponse[];
      expect(Array.isArray(body)).toBe(true);
      body.forEach((conv) => {
        expect(conv.dataSourceId).toBe(userDataSourceId);
      });
    });

    it('should not include other user conversations', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get('/api/v1/ai/conversations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const body = response.body as AIConversationResponse[];
      const adminConv = body.find((c) => c._id === adminConversationId);
      expect(adminConv).toBeUndefined();
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/ai/conversations')
        .expect(401);
    });
  });

  describe('GET /api/v1/ai/conversations/:id', () => {
    it('should get own conversation', async () => {
      const response = await request(app.getHttpServer() as Server)
        .get(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id', createdConversationId);
      expect(response.body).toHaveProperty('title');
    });

    it('should fail to get other user conversation', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/ai/conversations/${adminConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent conversation', async () => {
      await request(app.getHttpServer() as Server)
        .get('/api/v1/ai/conversations/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/ai/conversations/:id/messages', () => {
    it('should add a user message to conversation', async () => {
      const response = await request(app.getHttpServer() as Server)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'user',
          content: 'Can you make the chart blue?',
        })
        .expect(201);

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
      const response = await request(app.getHttpServer() as Server)
        .post(`/api/v1/ai/conversations/${createdConversationId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'assistant',
          content: 'I have updated the chart to blue.',
        })
        .expect(201);

      const body = response.body as AIConversationResponse;
      const lastMessage = body.messages[body.messages.length - 1];
      expect(lastMessage).toHaveProperty('role', 'assistant');
    });

    it('should fail to add message to other user conversation', async () => {
      await request(app.getHttpServer() as Server)
        .post(`/api/v1/ai/conversations/${adminConversationId}/messages`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          role: 'user',
          content: 'Hacking attempt',
        })
        .expect(404);
    });
  });

  describe('PUT /api/v1/ai/conversations/:id', () => {
    it('should update conversation title', async () => {
      const response = await request(app.getHttpServer() as Server)
        .put(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated: Create a blue bar chart showing sales by region',
        })
        .expect(200);

      const body = response.body as AIConversationResponse;
      expect(body.title).toContain('Updated:');
    });

    it('should fail to update other user conversation', async () => {
      await request(app.getHttpServer() as Server)
        .put(`/api/v1/ai/conversations/${adminConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Hacked title',
        })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/ai/conversations/:id', () => {
    it('should fail to delete other user conversation', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/ai/conversations/${adminConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });

    it('should delete own conversation', async () => {
      await request(app.getHttpServer() as Server)
        .delete(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(204);
    });

    it('should return 404 for already deleted conversation', async () => {
      await request(app.getHttpServer() as Server)
        .get(`/api/v1/ai/conversations/${createdConversationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
