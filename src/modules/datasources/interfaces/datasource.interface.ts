export interface DataSourceResponse {
  _id: string;
  id: string;
  name: string;
  type: string;
  endpoint?: string;
  filePath?: string;
  storageType?: string;
  config: Record<string, unknown>;
  ownerId: string;
  visibility: string;
  timestampField?: string;
  httpMethod: string;
  authType: string;
  esIndex?: string;
  createdAt?: string;
  updatedAt?: string;
}
