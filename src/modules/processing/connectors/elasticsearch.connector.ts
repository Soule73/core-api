import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import {
  IDataConnector,
  DataSourceConfig,
  FetchQuery,
  FetchResult,
  DataSourceType,
} from './connector.interface';

@Injectable()
export class ElasticsearchConnector implements IDataConnector {
  private readonly logger = new Logger(ElasticsearchConnector.name);

  supports(type: DataSourceType): boolean {
    return type === 'elasticsearch';
  }

  async fetchData(
    config: DataSourceConfig,
    query?: FetchQuery,
  ): Promise<FetchResult> {
    if (!config.endpoint || !config.esIndex) {
      throw new Error('Elasticsearch connector requires endpoint and esIndex');
    }

    this.logger.debug(
      `Fetching from Elasticsearch: ${config.endpoint}/${config.esIndex}`,
    );

    const client = this.buildClient(config);
    const esQuery = this.buildQuery(config, query);
    const searchParams = this.buildSearchParams(config, esQuery, query);

    const result = await client.search(searchParams);
    const hits = result.hits.hits || [];
    const data = hits.map((hit) => hit._source as Record<string, unknown>);

    const totalRaw = result.hits.total;
    const total =
      typeof totalRaw === 'object' ? totalRaw.value : totalRaw || data.length;

    return { data, total };
  }

  private buildClient(config: DataSourceConfig): Client {
    const clientOptions: Record<string, unknown> = {
      node: config.endpoint,
      requestTimeout: 30000,
    };

    const authType = config.authType || 'none';
    const authConfig = config.authConfig || {};

    switch (authType) {
      case 'basic':
        if (!authConfig.username || !authConfig.password) {
          throw new Error('Basic auth requires username and password');
        }
        clientOptions.auth = {
          username: authConfig.username,
          password: authConfig.password,
        };
        break;

      case 'bearer':
        if (!authConfig.token) {
          throw new Error('Bearer auth requires a token');
        }
        clientOptions.auth = { bearer: authConfig.token };
        break;

      case 'apiKey':
        if (!authConfig.apiKey) {
          throw new Error('API Key auth requires an apiKey');
        }
        clientOptions.auth = { apiKey: authConfig.apiKey };
        break;
    }

    return new Client(clientOptions);
  }

  private buildQuery(
    config: DataSourceConfig,
    query?: FetchQuery,
  ): Record<string, unknown> {
    const must: Record<string, unknown>[] = [];

    const baseQuery = config.esQuery || {};
    if (Object.keys(baseQuery).length > 0 && !('match_all' in baseQuery)) {
      must.push(baseQuery);
    }

    if (config.timestampField && (query?.from || query?.to)) {
      const range: Record<string, string> = {};
      if (query?.from) range.gte = query.from;
      if (query?.to) range.lte = query.to;
      must.push({ range: { [config.timestampField]: range } });
    }

    if (must.length === 0) {
      return { match_all: {} };
    }

    return { bool: { must } };
  }

  private buildSearchParams(
    config: DataSourceConfig,
    esQuery: Record<string, unknown>,
    query?: FetchQuery,
  ): Record<string, unknown> {
    const page = query?.page ?? 1;
    const size = query?.pageSize ?? 5000;
    const from = (page - 1) * size;

    const params: Record<string, unknown> = {
      index: config.esIndex,
      body: { query: esQuery },
      from,
      size,
    };

    if (query?.fields && query.fields.length > 0) {
      params._source = query.fields;
    }

    return params;
  }
}
