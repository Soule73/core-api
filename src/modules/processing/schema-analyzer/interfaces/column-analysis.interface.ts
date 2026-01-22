export type ColumnType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'object'
  | 'array'
  | 'null'
  | 'mixed';

export interface ColumnStats {
  name: string;
  type: ColumnType;
  nullable: boolean;
  uniqueCount: number;
  totalCount: number;
  cardinality: number;
  samples: unknown[];
  emptyCount: number;
  minValue?: number | string;
  maxValue?: number | string;
  avgValue?: number;
}

export interface SchemaAnalysisResult {
  columns: ColumnStats[];
  rowCount: number;
  analyzedAt: Date;
  dataSourceId?: string;
}

export interface AnalysisOptions {
  sampleSize?: number;
  maxUniqueValues?: number;
  detectDates?: boolean;
  dateFormats?: string[];
}

export const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  sampleSize: 5,
  maxUniqueValues: 1000,
  detectDates: true,
  dateFormats: [
    'YYYY-MM-DD',
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DDTHH:mm:ss',
  ],
};
