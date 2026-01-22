import { Injectable, Logger } from '@nestjs/common';
import { DataFetcherService } from './data-fetcher.service';
import { FilterEngine, Filter, FilterOperator } from '../filters';
import {
  AggregatorFactory,
  AggregationType,
  AggregationConfig,
} from '../aggregators';
import { GroupByTransformer, BucketConfig } from '../transformers';

export interface AggregateConfig {
  dataSourceId: string;
  metrics: AggregationConfig[];
  buckets?: BucketConfig[];
  filters?: Filter[];
  from?: string;
  to?: string;
}

export interface AggregateResult {
  success: boolean;
  data: Record<string, unknown>[];
  message?: string;
}

@Injectable()
export class DataProcessorService {
  private readonly logger = new Logger(DataProcessorService.name);

  constructor(
    private readonly dataFetcherService: DataFetcherService,
    private readonly filterEngine: FilterEngine,
    private readonly aggregatorFactory: AggregatorFactory,
    private readonly groupByTransformer: GroupByTransformer,
  ) {
    /** */
  }

  async aggregate(config: AggregateConfig): Promise<AggregateResult> {
    this.logger.log(`Aggregating data for source: ${config.dataSourceId}`);

    const rawData = await this.dataFetcherService.fetchRawData(
      config.dataSourceId,
    );

    let data = rawData;

    if (config.filters && config.filters.length > 0) {
      const filterResult = this.filterEngine.applyFilters(data, config.filters);
      data = filterResult.data;
      this.logger.debug(`Filtered to ${data.length} rows`);
    }

    const groups = this.groupByTransformer.groupBy(data, config.buckets || []);
    this.logger.debug(`Grouped into ${groups.length} groups`);

    const results: Record<string, unknown>[] = [];

    for (const group of groups) {
      const row: Record<string, unknown> = {};

      if (config.buckets && config.buckets.length > 0) {
        const keyValues = this.groupByTransformer.parseGroupKey(
          group.key,
          config.buckets,
        );
        Object.assign(row, keyValues);
      }

      for (const metric of config.metrics) {
        const values = group.items.map((item) => item[metric.field]);
        const aggregatedValue = this.aggregatorFactory.aggregate(
          metric.type,
          values,
        );

        const alias = metric.alias || `${metric.type}_${metric.field}`;
        row[alias] = aggregatedValue;
      }

      results.push(row);
    }

    this.logger.log(`Aggregation complete: ${results.length} result rows`);

    return {
      success: true,
      data: results,
      message: 'Aggregation completed successfully',
    };
  }

  filterData(
    data: Record<string, unknown>[],
    filters: Filter[],
  ): { success: boolean; data: Record<string, unknown>[]; count: number } {
    const result = this.filterEngine.applyFilters(data, filters);

    return {
      success: true,
      data: result.data,
      count: result.count,
    };
  }

  parseFilter(rawFilter: {
    field: string;
    operator: string;
    value: string;
  }): Filter {
    let parsedValue: unknown = rawFilter.value;

    if (
      rawFilter.operator === 'between' ||
      rawFilter.operator === 'in' ||
      rawFilter.operator === 'not_in'
    ) {
      try {
        parsedValue = JSON.parse(rawFilter.value);
      } catch {
        parsedValue = rawFilter.value.split(',').map((v) => v.trim());
      }
    } else if (rawFilter.value === 'true') {
      parsedValue = true;
    } else if (rawFilter.value === 'false') {
      parsedValue = false;
    } else if (!isNaN(Number(rawFilter.value))) {
      parsedValue = Number(rawFilter.value);
    }

    return {
      field: rawFilter.field,
      operator: rawFilter.operator as FilterOperator,
      value: parsedValue,
    };
  }

  parseAggregationConfig(rawConfig: {
    field: string;
    type: string;
    alias?: string;
  }): AggregationConfig {
    return {
      field: rawConfig.field,
      type: rawConfig.type as AggregationType,
      alias: rawConfig.alias,
    };
  }

  parseBucketConfig(rawBucket: {
    field: string;
    format?: string;
  }): BucketConfig {
    return {
      field: rawBucket.field,
      format: rawBucket.format,
    };
  }
}
