import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { ServiceUnavailableException } from '@nestjs/common';
import { BaseE2ETest } from '@e2e/base';
import type { Response } from 'supertest';
import { AIService } from '@core/modules/ai';
import type { AIGenerationResult } from '@core/modules/ai';
import type { WidgetResponse } from '@core/modules/widgets/interfaces';

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

interface GenerateWidgetPayload {
  dataSourceId: string;
  userPrompt: string;
  conversationId?: string;
  maxWidgets?: number;
}

/**
 * Builds a mock AIGenerationResult for use in E2E spies.
 */
function buildMockAIResult(
  dataSourceId: string,
  userId: string,
): AIGenerationResult {
  const mockWidget: WidgetResponse = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    title: 'Sales by Category',
    type: 'bar',
    dataSourceId,
    config: {
      metrics: [{ field: 'total', agg: 'sum', label: 'Total Sales' }],
      buckets: [{ field: 'category', type: 'terms' }],
      globalFilters: [],
      metricStyles: [{ color: '#6366f1', label: 'Total Sales' }],
      widgetParams: { title: 'Sales by Category' },
    },
    ownerId: userId,
    visibility: 'private',
    isGeneratedByAI: true,
    isDraft: true,
  };

  return {
    widgets: [mockWidget],
    conversationId: '000000000000000000000002',
    conversationTitle: 'Sales analysis dashboard',
    aiMessage: 'I generated a bar chart showing sales by category.',
    suggestions: ['Try filtering by date range', 'Add a line chart for trends'],
  };
}

/**
 * E2E test class for AI generation module.
 * Mocks the OpenAI call via vi.spyOn to avoid real API usage in tests.
 */
class AIGenerateWidgetE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/ai/generate-widget';
  private userDataSourceId = '';

  setUserDataSourceId(id: string): void {
    this.userDataSourceId = id;
  }

  getUserDataSourceId(): string {
    return this.userDataSourceId;
  }

  getDataSourceModel(): Model<DataSourceDoc> {
    return this.context.app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );
  }

  getAIService(): AIService {
    return this.context.app.get(AIService);
  }

  generateWidget(
    data: GenerateWidgetPayload,
    asAdmin = false,
  ): Promise<Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { asAdmin },
    );
  }

  generateWidgetWithoutAuth(
    data: Partial<GenerateWidgetPayload>,
  ): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }
}

const test = new AIGenerateWidgetE2ETest();

describe('AI Generate Widget (E2E)', () => {
  beforeAll(async () => {
    const DataSourceModel = test.getDataSourceModel();

    const userDs = await DataSourceModel.create({
      name: 'AI E2E Source',
      type: 'json',
      endpoint: 'https://jsonplaceholder.typicode.com/todos',
      ownerId: test.testData.regularUser._id,
    });
    test.setUserDataSourceId(String(userDs._id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/ai/generate-widget — input validation', () => {
    it('should return 401 without authentication', async () => {
      const response = await test.generateWidgetWithoutAuth({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 when dataSourceId is missing', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        { userPrompt: 'Show me a bar chart' },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when userPrompt is too short (< 5 chars)', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        {
          dataSourceId: test.getUserDataSourceId(),
          userPrompt: 'KPI',
        },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when dataSourceId is not a valid MongoId', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        {
          dataSourceId: 'not-a-valid-id',
          userPrompt: 'Show me a bar chart of results',
        },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when maxWidgets is out of range', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        {
          dataSourceId: test.getUserDataSourceId(),
          userPrompt: 'Show me a bar chart of results',
          maxWidgets: 50,
        },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/ai/generate-widget — service unavailable', () => {
    it('should return 503 when OpenAI API key is not configured', async () => {
      vi.spyOn(test.getAIService(), 'generateWidget').mockRejectedValueOnce(
        new ServiceUnavailableException(
          'AI service is not available. OPENAI_API_KEY is not configured.',
        ),
      );

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(503);
    });
  });

  describe('POST /api/v1/ai/generate-widget — successful generation', () => {
    it('should return 201 with AI-generated widgets array as drafts', async () => {
      const userId = test.testData.regularUser._id;
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);

      vi.spyOn(test.getAIService(), 'generateWidget').mockResolvedValueOnce(
        mockResult,
      );

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(201);

      const body = response.body as AIGenerationResult;
      expect(body).toHaveProperty('widgets');
      expect(body).toHaveProperty('conversationId');
      expect(body).toHaveProperty('conversationTitle');
      expect(body).toHaveProperty('aiMessage');
      expect(body).toHaveProperty('suggestions');

      expect(Array.isArray(body.widgets)).toBe(true);
      expect(body.widgets.length).toBeGreaterThan(0);
      expect(body.widgets[0].isGeneratedByAI).toBe(true);
      expect(body.widgets[0].isDraft).toBe(true);
      expect(Array.isArray(body.suggestions)).toBe(true);
      expect(typeof body.aiMessage).toBe('string');
      expect(typeof body.conversationTitle).toBe('string');
    });

    it('should pass conversationId for multi-turn generation', async () => {
      const userId = test.testData.regularUser._id;
      const existingConversationId = '000000000000000000000002';
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);
      mockResult.conversationId = existingConversationId;

      const spy = vi
        .spyOn(test.getAIService(), 'generateWidget')
        .mockResolvedValueOnce(mockResult);

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Now group by region instead of category',
        conversationId: existingConversationId,
      });

      expect(response.status).toBe(201);
      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          conversationId: existingConversationId,
          userPrompt: 'Now group by region instead of category',
        }),
      );

      const body = response.body as AIGenerationResult;
      expect(body.conversationId).toBe(existingConversationId);
    });

    it('should pass maxWidgets parameter to service', async () => {
      const userId = test.testData.regularUser._id;
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);

      const spy = vi
        .spyOn(test.getAIService(), 'generateWidget')
        .mockResolvedValueOnce(mockResult);

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Create a full dashboard for sales analysis',
        maxWidgets: 5,
      });

      expect(response.status).toBe(201);
      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ maxWidgets: 5 }),
      );
    });

    it('should return result with correct shape when admin generates', async () => {
      const userId = test.testData.adminUser._id;
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);

      vi.spyOn(test.getAIService(), 'generateWidget').mockResolvedValueOnce(
        mockResult,
      );

      const response = await test.generateWidget(
        {
          dataSourceId: test.getUserDataSourceId(),
          userPrompt: 'Show me widget for sales analysis',
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as AIGenerationResult;
      expect(body.widgets[0].isGeneratedByAI).toBe(true);
      expect(body.widgets[0].isDraft).toBe(true);
    });
  });

  describe('POST /api/v1/ai/generate-widget — data source access control', () => {
    it('should return 404 when data source does not exist', async () => {
      vi.spyOn(test.getAIService(), 'generateWidget').mockRejectedValueOnce(
        new (await import('@nestjs/common')).NotFoundException(
          'DataSource not found',
        ),
      );

      const response = await test.generateWidget({
        dataSourceId: '000000000000000000000099',
        userPrompt: 'Show me a chart of my data',
      });

      expect(response.status).toBe(404);
    });
  });
});

interface DataSourceDoc {
  _id: string;
  name: string;
  type: string;
  endpoint?: string;
  ownerId: string;
}

interface GenerateWidgetPayload {
  dataSourceId: string;
  userPrompt: string;
  conversationId?: string;
}

/**
 * Builds a mock AIGenerationResult for use in E2E spies.
 */
function buildMockAIResult(
  dataSourceId: string,
  userId: string,
): AIGenerationResult {
  const mockWidget: WidgetResponse = {
    _id: '000000000000000000000001',
    id: '000000000000000000000001',
    title: 'Sales by Category',
    type: 'bar',
    dataSourceId,
    config: {
      metrics: [{ field: 'total', aggregation: 'sum', label: 'Total Sales' }],
      buckets: [{ field: 'category', label: 'Category' }],
      widgetParams: {},
    },
    ownerId: userId,
    visibility: 'private',
    isGeneratedByAI: true,
    isDraft: true,
    reasoning: 'Bar chart is best suited to compare values across categories.',
    confidence: 0.9,
  };

  return {
    widget: mockWidget,
    conversationId: '000000000000000000000002',
    reasoning: 'Bar chart is best suited to compare values across categories.',
    confidence: 0.9,
    suggestions: ['Try filtering by date range', 'Add a line chart for trends'],
    aiMessage: 'Generated widget: Sales by Category',
  };
}

/**
 * E2E test class for AI generation module.
 * Mocks the OpenAI call via vi.spyOn to avoid real API usage in tests.
 */
class AIGenerateWidgetE2ETest extends BaseE2ETest {
  private readonly basePath = '/api/v1/ai/generate-widget';
  private userDataSourceId = '';

  setUserDataSourceId(id: string): void {
    this.userDataSourceId = id;
  }

  getUserDataSourceId(): string {
    return this.userDataSourceId;
  }

  getDataSourceModel(): Model<DataSourceDoc> {
    return this.context.app.get<Model<DataSourceDoc>>(
      getModelToken('DataSource'),
    );
  }

  getAIService(): AIService {
    return this.context.app.get(AIService);
  }

  generateWidget(
    data: GenerateWidgetPayload,
    asAdmin = false,
  ): Promise<Response> {
    return this.post(
      this.basePath,
      data as unknown as Record<string, unknown>,
      { asAdmin },
    );
  }

  generateWidgetWithoutAuth(
    data: Partial<GenerateWidgetPayload>,
  ): Promise<Response> {
    return this.post(this.basePath, data, { useAuth: false });
  }
}

const test = new AIGenerateWidgetE2ETest();

describe('AI Generate Widget (E2E)', () => {
  beforeAll(async () => {
    const DataSourceModel = test.getDataSourceModel();

    const userDs = await DataSourceModel.create({
      name: 'AI E2E Source',
      type: 'json',
      endpoint: 'https://jsonplaceholder.typicode.com/todos',
      ownerId: test.testData.regularUser._id,
    });
    test.setUserDataSourceId(String(userDs._id));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/v1/ai/generate-widget — input validation', () => {
    it('should return 401 without authentication', async () => {
      const response = await test.generateWidgetWithoutAuth({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(401);
    });

    it('should return 400 when dataSourceId is missing', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        { userPrompt: 'Show me a bar chart' },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when userPrompt is too short (< 5 chars)', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        {
          dataSourceId: test.getUserDataSourceId(),
          userPrompt: 'KPI',
        },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });

    it('should return 400 when dataSourceId is not a valid MongoId', async () => {
      const response = await test.post(
        '/api/v1/ai/generate-widget',
        {
          dataSourceId: 'not-a-valid-id',
          userPrompt: 'Show me a bar chart of results',
        },
        { asAdmin: false },
      );

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/ai/generate-widget — service unavailable', () => {
    it('should return 503 when OpenAI API key is not configured', async () => {
      vi.spyOn(test.getAIService(), 'generateWidget').mockRejectedValueOnce(
        new ServiceUnavailableException(
          'AI service is not available. OPENAI_API_KEY is not configured.',
        ),
      );

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(503);
    });
  });

  describe('POST /api/v1/ai/generate-widget — successful generation', () => {
    it('should return 201 with AI-generated widget as draft', async () => {
      const userId = test.testData.regularUser._id;
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);

      vi.spyOn(test.getAIService(), 'generateWidget').mockResolvedValueOnce(
        mockResult,
      );

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Show me a bar chart of results by status',
      });

      expect(response.status).toBe(201);

      const body = response.body as AIGenerationResult;
      expect(body).toHaveProperty('widget');
      expect(body).toHaveProperty('conversationId');
      expect(body).toHaveProperty('reasoning');
      expect(body).toHaveProperty('confidence');
      expect(body).toHaveProperty('suggestions');
      expect(body).toHaveProperty('aiMessage');

      expect(body.widget.isGeneratedByAI).toBe(true);
      expect(body.widget.isDraft).toBe(true);
      expect(typeof body.confidence).toBe('number');
      expect(Array.isArray(body.suggestions)).toBe(true);
    });

    it('should pass conversationId for multi-turn generation', async () => {
      const userId = test.testData.regularUser._id;
      const existingConversationId = '000000000000000000000002';
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);
      mockResult.conversationId = existingConversationId;

      const spy = vi
        .spyOn(test.getAIService(), 'generateWidget')
        .mockResolvedValueOnce(mockResult);

      const response = await test.generateWidget({
        dataSourceId: test.getUserDataSourceId(),
        userPrompt: 'Now group by region instead of category',
        conversationId: existingConversationId,
      });

      expect(response.status).toBe(201);
      expect(spy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          conversationId: existingConversationId,
          userPrompt: 'Now group by region instead of category',
        }),
      );

      const body = response.body as AIGenerationResult;
      expect(body.conversationId).toBe(existingConversationId);
    });

    it('should return result with correct shape when admin generates', async () => {
      const userId = test.testData.adminUser._id;
      const mockResult = buildMockAIResult(test.getUserDataSourceId(), userId);

      vi.spyOn(test.getAIService(), 'generateWidget').mockResolvedValueOnce(
        mockResult,
      );

      const response = await test.generateWidget(
        {
          dataSourceId: test.getUserDataSourceId(),
          userPrompt: 'Show me widget for sales analysis',
        },
        true,
      );

      expect(response.status).toBe(201);
      const body = response.body as AIGenerationResult;
      expect(body.widget.isGeneratedByAI).toBe(true);
      expect(body.widget.isDraft).toBe(true);
    });
  });

  describe('POST /api/v1/ai/generate-widget — data source access control', () => {
    it('should return 404 when data source does not exist', async () => {
      vi.spyOn(test.getAIService(), 'generateWidget').mockRejectedValueOnce(
        new (await import('@nestjs/common')).NotFoundException(
          'DataSource not found',
        ),
      );

      const response = await test.generateWidget({
        dataSourceId: '000000000000000000000099',
        userPrompt: 'Show me a chart of my data',
      });

      expect(response.status).toBe(404);
    });
  });
});
