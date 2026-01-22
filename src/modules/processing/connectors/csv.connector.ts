import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs/promises';
import * as path from 'path';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
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
export class CsvConnector implements IDataConnector {
  private readonly logger = new Logger(CsvConnector.name);

  constructor(private readonly httpService: HttpService) {
    /** */
  }

  supports(type: DataSourceType): boolean {
    return type === 'csv';
  }

  async fetchData(
    config: DataSourceConfig,
    query?: FetchQuery,
  ): Promise<FetchResult> {
    let data: Record<string, unknown>[];

    if (config.filePath) {
      this.logger.debug(`Reading CSV from file: ${config.filePath}`);
      data = await this.readCsvFile(config.filePath);
    } else if (config.endpoint) {
      this.logger.debug(`Fetching CSV from: ${config.endpoint}`);
      data = await this.fetchRemoteCsv(config);
    } else {
      throw new Error('CSV connector requires either filePath or endpoint');
    }

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

  private async readCsvFile(
    filePath: string,
  ): Promise<Record<string, unknown>[]> {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);

    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    return this.parseCsvString(fileContent);
  }

  private async fetchRemoteCsv(
    config: DataSourceConfig,
  ): Promise<Record<string, unknown>[]> {
    const headers = this.buildHeaders(
      config.authType || 'none',
      config.authConfig || {},
    );

    const axiosConfig = {
      method: (config.httpMethod?.toLowerCase() || 'get') as 'get' | 'post',
      url: config.endpoint!,
      headers,
      timeout: 30000,
      responseType: 'text' as const,
    };

    const response = await firstValueFrom(
      this.httpService.request<string>(axiosConfig),
    );
    return this.parseCsvString(response.data);
  }

  private parseCsvString(
    csvContent: string,
  ): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const results: Record<string, unknown>[] = [];
      const stream = Readable.from([csvContent]);

      stream
        .pipe(csvParser())
        .on('data', (row: Record<string, unknown>) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  private buildHeaders(
    authType: AuthType,
    authConfig: AuthConfig,
  ): Record<string, string> {
    const headers: Record<string, string> = {};

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
}
