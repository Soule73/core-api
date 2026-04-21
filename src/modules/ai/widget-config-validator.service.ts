import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { WIDGET_TYPES } from '../widgets/constants';
import { ParsedWidgetConfig } from './interfaces';

const REQUIRED_CONFIG_KEYS = ['metrics', 'buckets', 'widgetParams'] as const;

@Injectable()
export class WidgetConfigValidatorService {
  private readonly logger = new Logger(WidgetConfigValidatorService.name);

  /**
   * Validates and sanitizes an array of raw OpenAI-parsed widget configs.
   * Skips individual widgets that fail validation with a warning rather than
   * aborting the entire generation.
   *
   * @param raws - Array of raw parsed objects from OpenAI response
   * @param availableColumns - Column names from the schema analysis
   * @returns Array of sanitized and validated widget configs
   * @throws BadRequestException if no widget passes validation
   */
  validateAll(
    raws: Array<Record<string, unknown>>,
    availableColumns: string[],
  ): ParsedWidgetConfig[] {
    const results: ParsedWidgetConfig[] = [];

    for (const raw of raws) {
      try {
        results.push(this.validate(raw, availableColumns));
      } catch (error) {
        this.logger.warn(
          `Skipping invalid widget from AI response: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (results.length === 0) {
      throw new BadRequestException(
        'AI response contained no valid widget configurations.',
      );
    }

    return results;
  }

  /**
   * Validates and sanitizes a raw OpenAI-parsed widget config.
   * Ensures the widget type is valid, fields exist in the available columns,
   * and all required config keys are present.
   *
   * @param raw - Raw parsed object from OpenAI response
   * @param availableColumns - Column names from the schema analysis
   * @returns Sanitized and validated widget config
   * @throws BadRequestException if the config is irrecoverably invalid
   */
  validate(
    raw: Record<string, unknown>,
    availableColumns: string[],
  ): ParsedWidgetConfig {
    this.validateWidgetType(raw.type);
    this.validateConfigStructure(raw.config);

    const config = raw.config as Record<string, unknown>;
    const metrics = (config.metrics as Array<Record<string, unknown>>) || [];

    this.validateMetricFields(metrics, availableColumns);
    this.validateMetricFilters(metrics);

    return {
      type: raw.type as string,
      title: (raw.title as string) || 'Generated Widget',
      modifyWidgetId:
        typeof raw.modifyWidgetId === 'string' ? raw.modifyWidgetId : undefined,
      description: raw.description as string | undefined,
      reasoning: raw.reasoning as string | undefined,
      confidence: this.parseConfidence(raw.confidence),
      config,
    };
  }

  private validateWidgetType(type: unknown): void {
    if (!type || typeof type !== 'string') {
      throw new BadRequestException('AI response missing widget type');
    }

    const validTypes: readonly string[] = WIDGET_TYPES;
    if (!validTypes.includes(type)) {
      throw new BadRequestException(
        `Invalid widget type "${type}". Valid types: ${WIDGET_TYPES.join(', ')}`,
      );
    }
  }

  private validateConfigStructure(config: unknown): void {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new BadRequestException('AI response missing config object');
    }

    const configObj = config as Record<string, unknown>;
    const missingKeys = REQUIRED_CONFIG_KEYS.filter(
      (key) => !(key in configObj),
    );

    if (missingKeys.length > 0) {
      throw new BadRequestException(
        `Widget config missing required keys: ${missingKeys.join(', ')}`,
      );
    }

    if (!Array.isArray(configObj.metrics)) {
      throw new BadRequestException(
        'Widget config field "metrics" must be an array',
      );
    }

    if (!Array.isArray(configObj.buckets)) {
      throw new BadRequestException(
        'Widget config field "buckets" must be an array',
      );
    }

    if (
      !configObj.widgetParams ||
      typeof configObj.widgetParams !== 'object' ||
      Array.isArray(configObj.widgetParams)
    ) {
      throw new BadRequestException(
        'Widget config field "widgetParams" must be an object',
      );
    }
  }

  private validateMetricFields(
    metrics: Array<Record<string, unknown>>,
    availableColumns: string[],
  ): void {
    for (const metric of metrics) {
      if (metric.field && typeof metric.field === 'string') {
        if (!availableColumns.includes(metric.field)) {
          this.logger.warn(
            `Metric references unknown column "${metric.field}". Available: ${availableColumns.join(', ')}`,
          );
        }
      }

      if (metric.fields && Array.isArray(metric.fields)) {
        const unknownFields = (metric.fields as string[]).filter(
          (f) => !availableColumns.includes(f),
        );
        if (unknownFields.length > 0) {
          this.logger.warn(
            `Metric references unknown columns: ${unknownFields.join(', ')}`,
          );
        }
      }
    }
  }

  private validateMetricFilters(metrics: Array<Record<string, unknown>>): void {
    for (const metric of metrics) {
      if (!Array.isArray(metric.filters)) {
        continue;
      }

      for (const filter of metric.filters as Array<Record<string, unknown>>) {
        const missingFilterKeys = ['field', 'operator', 'value'].filter(
          (k) => !(k in filter),
        );

        if (missingFilterKeys.length > 0) {
          throw new BadRequestException(
            `Metric filter missing required keys: ${missingFilterKeys.join(', ')}`,
          );
        }
      }
    }
  }

  private parseConfidence(value: unknown): number {
    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) return 0.5;
    return Math.max(0, Math.min(1, num));
  }
}
