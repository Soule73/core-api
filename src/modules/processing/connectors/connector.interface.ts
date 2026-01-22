export type DataSourceType = 'json' | 'csv' | 'elasticsearch';
export type AuthType = 'none' | 'basic' | 'bearer' | 'apiKey';
export type HttpMethod = 'GET' | 'POST';

export interface AuthConfig {
  token?: string;
  apiKey?: string;
  username?: string;
  password?: string;
  headerName?: string;
}

export interface DataSourceConfig {
  type: DataSourceType;
  endpoint?: string;
  filePath?: string;
  httpMethod?: HttpMethod;
  authType?: AuthType;
  authConfig?: AuthConfig;
  timestampField?: string;
  esIndex?: string;
  esQuery?: Record<string, unknown>;
}

export interface FetchQuery {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  skip?: number;
  fields?: string[];
  filters?: Record<string, unknown>[];
  sort?: { field: string; order: 'asc' | 'desc' };
}

export interface FetchResult {
  data: Record<string, unknown>[];
  total: number;
}

export interface IDataConnector {
  fetchData(config: DataSourceConfig, query?: FetchQuery): Promise<FetchResult>;
  supports(type: DataSourceType): boolean;
}
