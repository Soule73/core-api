export type AggregationType =
  | 'sum'
  | 'avg'
  | 'count'
  | 'min'
  | 'max'
  | 'first'
  | 'last';

export interface AggregationConfig {
  field: string;
  type: AggregationType;
  alias?: string;
}

export interface AggregationResult {
  value: number | string | null;
  alias: string;
}

export interface IAggregator {
  getType(): AggregationType;
  aggregate(values: unknown[]): number | string | null;
}
