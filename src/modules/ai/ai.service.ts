import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DataSourcesService } from '../datasources/datasources.service';
import { DataFetcherService } from '../processing/services/data-fetcher.service';
import { SchemaAnalyzerService } from '../processing/schema-analyzer/schema-analyzer.service';
import { AIConversationsService } from '../ai-conversations/ai-conversations.service';
import { WidgetsService } from '../widgets/widgets.service';
import {
  PromptBuilderService,
  OPENAI_MAX_TOKENS,
} from './prompt-builder.service';
import { WidgetConfigValidatorService } from './widget-config-validator.service';
import { GenerateWidgetDto } from './dto';
import { AIGenerationResult } from './interfaces';
import { WidgetResponse } from '../widgets/interfaces';

const MAX_DATA_ROWS_FOR_ANALYSIS = 500;
const OPENAI_TEMPERATURE = 0.3;
const DEFAULT_MAX_WIDGETS = 3;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openai: OpenAI | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSourcesService: DataSourcesService,
    private readonly dataFetcherService: DataFetcherService,
    private readonly schemaAnalyzerService: SchemaAnalyzerService,
    private readonly aiConversationsService: AIConversationsService,
    private readonly widgetsService: WidgetsService,
    private readonly promptBuilderService: PromptBuilderService,
    private readonly widgetConfigValidatorService: WidgetConfigValidatorService,
  ) {
    const apiKey = this.configService.get<string>('app.openaiApiKey');
    this.openai = apiKey ? new OpenAI({ apiKey }) : null;

    if (!this.openai) {
      this.logger.warn(
        'OPENAI_API_KEY not configured. AI features will be unavailable.',
      );
    }
  }

  /**
   * Generates one or more widgets based on the user's prompt and data source.
   * Orchestrates: data fetch → schema analysis → prompt build → OpenAI call →
   * config validation → widget creation → conversation update.
   *
   * @param userId - Authenticated user ID
   * @param dto - Generation request with dataSourceId, userPrompt, optional conversationId, maxWidgets
   * @returns Generated widgets with conversation context and AI metadata
   * @throws ServiceUnavailableException if OpenAI key is not configured
   * @throws NotFoundException if data source does not exist
   */
  async generateWidget(
    userId: string,
    dto: GenerateWidgetDto,
  ): Promise<AIGenerationResult> {
    this.ensureOpenAIAvailable();

    const dataSource = await this.dataSourcesService.findOne(
      dto.dataSourceId,
      userId,
    );

    if (!dataSource) {
      throw new NotFoundException(`DataSource not found: ${dto.dataSourceId}`);
    }

    const fetchResult = await this.dataFetcherService.fetchData({
      dataSourceId: dto.dataSourceId,
      userId,
    });

    const dataSlice = fetchResult.data.slice(0, MAX_DATA_ROWS_FOR_ANALYSIS);
    const schemaAnalysis = this.schemaAnalyzerService.analyzeSchema(dataSlice);

    const conversation = await this.resolveConversation(
      userId,
      dto,
      dataSource.name,
    );

    const conversationHistory = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const maxWidgets = dto.maxWidgets ?? DEFAULT_MAX_WIDGETS;
    const systemPrompt = this.promptBuilderService.buildSystemPrompt();
    const userPrompt = this.promptBuilderService.buildUserPrompt(
      dto.userPrompt,
      schemaAnalysis,
      maxWidgets,
      conversationHistory,
    );

    const aiModel = this.configService.get<string>(
      'app.aiModel',
      'gpt-4o-mini',
    );
    const rawResponse = await this.callOpenAI(
      systemPrompt,
      userPrompt,
      aiModel,
    );

    const availableColumns = schemaAnalysis.columns.map((c) => c.name);
    const rawWidgets = this.extractRawWidgets(rawResponse);
    const validatedWidgets = this.widgetConfigValidatorService.validateAll(
      rawWidgets,
      availableColumns,
    );

    const createdWidgets = await this.createWidgets(
      userId,
      dto,
      conversation._id,
      validatedWidgets,
    );

    const conversationTitle =
      typeof rawResponse.conversationTitle === 'string'
        ? rawResponse.conversationTitle
        : `AI generation — ${dataSource.name}`;

    const aiMessage =
      typeof rawResponse.aiMessage === 'string'
        ? rawResponse.aiMessage
        : `Generated ${createdWidgets.length} widget(s) from your data.`;

    await this.updateConversationAfterGeneration(
      conversation._id,
      userId,
      dto.userPrompt,
      aiMessage,
      createdWidgets.length,
      schemaAnalysis,
      rawResponse,
    );

    return {
      widgets: createdWidgets,
      conversationId: conversation._id,
      conversationTitle,
      aiMessage,
      suggestions: Array.isArray(rawResponse.suggestions)
        ? (rawResponse.suggestions as string[])
        : [],
    };
  }

  private ensureOpenAIAvailable(): void {
    if (!this.openai) {
      throw new ServiceUnavailableException(
        'AI service is not available. OPENAI_API_KEY is not configured.',
      );
    }
  }

  private async resolveConversation(
    userId: string,
    dto: GenerateWidgetDto,
    dataSourceName: string,
  ) {
    if (dto.conversationId) {
      return this.aiConversationsService.findOne(dto.conversationId, userId);
    }

    return this.aiConversationsService.create(userId, {
      dataSourceId: dto.dataSourceId,
      title: `AI generation — ${dataSourceName}`,
    });
  }

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    model: string,
  ): Promise<Record<string, unknown>> {
    this.logger.log(`Calling OpenAI model: ${model}`);

    const completion = await this.openai!.chat.completions.create({
      model,
      temperature: OPENAI_TEMPERATURE,
      max_tokens: OPENAI_MAX_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new ServiceUnavailableException(
        'OpenAI returned an empty response',
      );
    }

    this.logger.debug(`OpenAI raw response length: ${content.length}`);

    try {
      return JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      this.logger.warn(
        `OpenAI returned malformed JSON: ${
          error instanceof Error ? error.message : 'Unknown parse error'
        }`,
      );
      throw new ServiceUnavailableException('OpenAI returned malformed JSON');
    }
  }

  private extractRawWidgets(
    rawResponse: Record<string, unknown>,
  ): Array<Record<string, unknown>> {
    if (Array.isArray(rawResponse.widgets)) {
      return rawResponse.widgets as Array<Record<string, unknown>>;
    }

    if (rawResponse.type && rawResponse.config) {
      this.logger.warn(
        'OpenAI returned a flat widget object instead of a widgets array. Wrapping it.',
      );
      return [rawResponse];
    }

    throw new ServiceUnavailableException(
      'OpenAI response does not contain a valid widgets array.',
    );
  }

  private async createWidgets(
    userId: string,
    dto: GenerateWidgetDto,
    conversationId: string,
    validatedWidgets: Array<{
      type: string;
      title: string;
      description?: string;
      reasoning?: string;
      confidence?: number;
      config: Record<string, unknown>;
    }>,
  ): Promise<WidgetResponse[]> {
    const created: WidgetResponse[] = [];

    for (const validated of validatedWidgets) {
      const widget = await this.widgetsService.create(userId, {
        title: validated.title,
        type: validated.type as never,
        dataSourceId: dto.dataSourceId,
        config: validated.config,
        visibility: 'private',
        isGeneratedByAI: true,
        isDraft: true,
        conversationId,
        description: validated.description,
        reasoning: validated.reasoning,
        confidence: validated.confidence,
      });

      created.push(widget);
    }

    return created;
  }

  private async updateConversationAfterGeneration(
    conversationId: string,
    userId: string,
    userPrompt: string,
    aiMessage: string,
    widgetsCount: number,
    schemaAnalysis: {
      rowCount: number;
      columns: Array<{
        name: string;
        type: string;
        uniqueCount: number;
        samples: unknown[];
      }>;
    },
    rawResponse: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.aiConversationsService.addMessage(conversationId, userId, {
        role: 'user',
        content: userPrompt,
      });

      await this.aiConversationsService.addMessage(conversationId, userId, {
        role: 'assistant',
        content: aiMessage,
        widgetsGenerated: widgetsCount,
      });

      await this.aiConversationsService.update(conversationId, userId, {
        dataSourceSummary: {
          totalRows: schemaAnalysis.rowCount,
          columns: schemaAnalysis.columns.map((c) => ({
            name: c.name,
            type: c.type,
            uniqueValues: c.uniqueCount,
            sampleValues: c.samples,
          })),
        },
        suggestions: Array.isArray(rawResponse.suggestions)
          ? (rawResponse.suggestions as string[])
          : [],
      });
    } catch (error) {
      this.logger.error(
        'Failed to update conversation after generation',
        error,
      );
    }
  }
}
