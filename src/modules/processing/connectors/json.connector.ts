import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IDataConnector,
  DataSourceConfig,
  FetchQuery,
  FetchResult,
  DataSourceType,
  AuthConfig,
  AuthType,
} from './connector.interface';

@Injectable()
export class JsonConnector implements IDataConnector {
  private readonly logger = new Logger(JsonConnector.name);

  constructor(private readonly httpService: HttpService) {
    //
  }

  supports(type: DataSourceType): boolean {
    return type === 'json';
  }

  async fetchData(
    config: DataSourceConfig,
    query?: FetchQuery,
  ): Promise<FetchResult> {
    if (!config.endpoint) {
      throw new Error('JSON connector requires an endpoint');
    }

    this.validateEndpoint(config.endpoint);

    this.logger.debug(`Fetching JSON from: ${config.endpoint}`);

    const headers = this.buildHeaders(
      config.authType || 'none',
      config.authConfig || {},
    );

    const axiosConfig = {
      method: (config.httpMethod?.toLowerCase() || 'get') as 'get' | 'post',
      url: config.endpoint,
      headers,
      timeout: 30000,
    };

    const response = await firstValueFrom(
      this.httpService.request<unknown>(axiosConfig),
    );
    const rawData = response.data;
    const data: Record<string, unknown>[] = this.extractDataArray(rawData);

    let filteredData = this.filterByTimestamp(
      data,
      config.timestampField,
      query?.from,
      query?.to,
    );

    filteredData = this.selectFields(filteredData, query?.fields);

    const total = filteredData.length;
    const paginatedData = this.paginate(
      filteredData,
      query?.page,
      query?.pageSize,
    );

    return { data: paginatedData, total };
  }

  private validateEndpoint(endpoint: string): void {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new Error(`Invalid endpoint URL: ${endpoint}`);
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Only http and https protocols are allowed');
    }

    const hostname = url.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^0\.0\.0\.0$/,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
    ];

    if (blockedPatterns.some((p) => p.test(hostname))) {
      throw new BadRequestException(
        'Requests to internal or private addresses are not allowed',
      );
    }
  }

  private buildHeaders(
    authType: AuthType,
    authConfig: AuthConfig,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    switch (authType) {
      case 'bearer':
        if (authConfig.token) {
          headers['Authorization'] = `Bearer ${authConfig.token}`;
        }
        break;
      case 'apiKey':
        if (authConfig.apiKey) {
          const headerName = authConfig.headerName || 'x-api-key';
          headers[headerName] = authConfig.apiKey;
        }
        break;
      case 'basic':
        if (authConfig.username && authConfig.password) {
          const encoded = Buffer.from(
            `${authConfig.username}:${authConfig.password}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${encoded}`;
        }
        break;
    }

    return headers;
  }

  private filterByTimestamp(
    data: Record<string, unknown>[],
    timestampField?: string,
    from?: string,
    to?: string,
  ): Record<string, unknown>[] {
    if (!timestampField || (!from && !to)) {
      return data;
    }

    return data.filter((row) => {
      const ts = row[timestampField];
      if (!ts) return false;

      let date: Date | null = null;
      if (typeof ts === 'string' && !isNaN(Date.parse(ts))) {
        date = new Date(ts);
      } else if (typeof ts === 'number') {
        date = new Date(ts);
      } else if (ts instanceof Date) {
        date = ts;
      }

      if (!date || isNaN(date.getTime())) return false;
      if (from && date < new Date(from)) return false;
      if (to && date > new Date(to)) return false;

      return true;
    });
  }

  private selectFields(
    data: Record<string, unknown>[],
    fields?: string[],
  ): Record<string, unknown>[] {
    if (!fields || fields.length === 0) return data;

    return data.map((row) =>
      Object.fromEntries(
        Object.entries(row).filter(([key]) => fields.includes(key)),
      ),
    );
  }

  private paginate(
    data: Record<string, unknown>[],
    page?: number,
    pageSize?: number,
  ): Record<string, unknown>[] {
    if (!page || !pageSize) return data;

    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }

  private extractDataArray(rawData: unknown): Record<string, unknown>[] {
    if (Array.isArray(rawData)) {
      return rawData as Record<string, unknown>[];
    }

    if (rawData && typeof rawData === 'object') {
      const obj = rawData as Record<string, unknown>;

      for (const key of ['data', 'items', 'results', 'records', 'rows']) {
        if (Array.isArray(obj[key])) {
          this.logger.debug(`Extracted data array from '${key}' property`);
          return obj[key] as Record<string, unknown>[];
        }
      }

      return [obj];
    }

    return [];
  }
}
