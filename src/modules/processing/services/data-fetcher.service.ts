import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager_1 from 'cache-manager';
import {
  DataSource,
  DataSourceDocument,
} from '../../datasources/schemas/datasource.schema';
import { ConnectorFactory, DataSourceConfig, FetchQuery } from '../connectors';

export interface FetchDataResult {
  success: boolean;
  data: Record<string, unknown>[];
  total: number;
  message?: string;
  cached?: boolean;
}

export interface FetchDataOptions {
  dataSourceId: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  fields?: string;
  forceRefresh?: boolean;
}

@Injectable()
export class DataFetcherService {
  private readonly logger = new Logger(DataFetcherService.name);
  private readonly DEFAULT_CACHE_TTL = 300000;
  private readonly TIMESERIES_CACHE_TTL = 60000;

  constructor(
    @InjectModel(DataSource.name)
    private readonly dataSourceModel: Model<DataSourceDocument>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: cacheManager_1.Cache,
    private readonly connectorFactory: ConnectorFactory,
  ) {
    /**   */
  }

  async fetchData(options: FetchDataOptions): Promise<FetchDataResult> {
    this.logger.log(`Fetching data for source: ${options.dataSourceId}`);

    const dataSource = await this.dataSourceModel
      .findById(options.dataSourceId)
      .lean()
      .exec();

    if (!dataSource) {
      throw new NotFoundException(
        `DataSource not found: ${options.dataSourceId}`,
      );
    }

    const config = this.buildConfig(dataSource);
    const query = this.buildQuery(options);
    const cacheKey = this.generateCacheKey(options);

    if (options.forceRefresh) {
      try {
        await this.cacheManager.del(cacheKey);
        this.logger.debug(`Cache invalidated for: ${cacheKey}`);
      } catch (err) {
        this.logger.warn(
          `Cache invalidation skipped (unavailable): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    let cachedResult: FetchDataResult | undefined;
    try {
      cachedResult =
        (await this.cacheManager.get<FetchDataResult>(cacheKey)) ?? undefined;
    } catch (err) {
      this.logger.warn(
        `Cache read skipped (unavailable): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (cachedResult) {
      this.logger.debug(`Cache hit for: ${cacheKey}`);
      return cachedResult;
    }

    const connector = this.connectorFactory.getConnector(config.type);
    const result = await connector.fetchData(config, query);

    const ttl = this.computeCacheTtl(dataSource, options);

    const fetchResult: FetchDataResult = {
      success: true,
      data: result.data,
      total: result.total,
      message: 'Data fetched successfully',
    };

    try {
      await this.cacheManager.set(cacheKey, fetchResult, ttl);
    } catch (err) {
      this.logger.warn(
        `Cache write skipped (unavailable): ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return fetchResult;
  }

  async fetchRawData(
    dataSourceId: string,
    sampleSize?: number,
  ): Promise<Record<string, unknown>[]> {
    const dataSource = await this.dataSourceModel
      .findById(dataSourceId)
      .lean()
      .exec();

    if (!dataSource) {
      throw new NotFoundException(`DataSource not found: ${dataSourceId}`);
    }

    const config = this.buildConfig(dataSource);
    const query: FetchQuery = {
      page: 1,
      pageSize: sampleSize || 1000,
    };

    const connector = this.connectorFactory.getConnector(config.type);
    const result = await connector.fetchData(config, query);

    return result.data;
  }

  async detectColumns(config: DataSourceConfig): Promise<{
    columns: string[];
    preview: Record<string, unknown>[];
    types: Record<string, string>;
  }> {
    const connector = this.connectorFactory.getConnector(config.type);
    const result = await connector.fetchData(config, { page: 1, pageSize: 5 });

    const columns = result.data[0] ? Object.keys(result.data[0]) : [];
    const preview = result.data.slice(0, 5);
    const types = this.inferColumnTypes(preview, columns);

    return { columns, preview, types };
  }

  private buildConfig(
    dataSource: DataSourceDocument | Record<string, unknown>,
  ): DataSourceConfig {
    return {
      type: dataSource.type as DataSourceConfig['type'],
      endpoint: dataSource.endpoint as string | undefined,
      filePath: dataSource.filePath as string | undefined,
      httpMethod: dataSource.httpMethod as DataSourceConfig['httpMethod'],
      authType: dataSource.authType as DataSourceConfig['authType'],
      authConfig: dataSource.authConfig as DataSourceConfig['authConfig'],
      timestampField: dataSource.timestampField as string | undefined,
      esIndex: dataSource.esIndex as string | undefined,
      esQuery: dataSource.esQuery as Record<string, unknown> | undefined,
    };
  }

  private buildQuery(options: FetchDataOptions): FetchQuery {
    return {
      from: options.from,
      to: options.to,
      page: options.page,
      pageSize: options.pageSize,
      fields: options.fields
        ? options.fields.split(',').map((f) => f.trim())
        : undefined,
    };
  }

  private generateCacheKey(options: FetchDataOptions): string {
    const parts = [
      'processing',
      'fetch',
      options.userId || 'anonymous',
      options.dataSourceId,
      options.from || 'no-from',
      options.to || 'no-to',
      options.page?.toString() || '1',
      options.pageSize?.toString() || 'all',
      options.fields || 'all-fields',
    ];
    return parts.join(':');
  }

  private computeCacheTtl(
    dataSource: DataSourceDocument | Record<string, unknown>,
    options: FetchDataOptions,
  ): number {
    const hasTimestamp = !!dataSource.timestampField;

    if (hasTimestamp && options.from && options.to) {
      return this.TIMESERIES_CACHE_TTL;
    }

    if (hasTimestamp && !options.from && !options.to) {
      return Math.floor(this.DEFAULT_CACHE_TTL / 2);
    }

    return this.DEFAULT_CACHE_TTL;
  }

  private inferColumnTypes(
    rows: Record<string, unknown>[],
    columns: string[],
  ): Record<string, string> {
    const types: Record<string, string> = {};

    const isISODate = (val: unknown): boolean =>
      typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val);

    const isISODateTime = (val: unknown): boolean =>
      typeof val === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(
        val,
      );

    const isBooleanString = (val: unknown): boolean =>
      val === 'true' || val === 'false';

    const isNumberish = (val: unknown): boolean =>
      val !== '' && !Array.isArray(val) && !isNaN(Number(val));

    for (const col of columns) {
      const values = rows
        .map((row) => row[col])
        .filter((v) => v !== undefined && v !== null && v !== '');

      if (values.length === 0) {
        types[col] = 'unknown';
        continue;
      }

      if (values.every((v) => typeof v === 'object' && !Array.isArray(v))) {
        types[col] = 'object';
        continue;
      }

      if (values.every((v) => Array.isArray(v))) {
        types[col] = 'array';
        continue;
      }

      if (values.every(isISODate)) {
        types[col] = 'date';
        continue;
      }

      if (values.every(isISODateTime)) {
        types[col] = 'datetime';
        continue;
      }

      if (values.every((v) => typeof v === 'boolean' || isBooleanString(v))) {
        types[col] = 'boolean';
        continue;
      }

      if (values.every(isNumberish)) {
        const allInt = values.every((v) => Number(v) % 1 === 0);
        types[col] = allInt ? 'integer' : 'number';
        continue;
      }

      types[col] = 'string';
    }

    return types;
  }
}
