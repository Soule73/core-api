export interface BucketConfig {
  field: string;
  format?: string;
}

export interface GroupedData {
  key: string;
  items: Record<string, unknown>[];
}
