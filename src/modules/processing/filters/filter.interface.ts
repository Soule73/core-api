export const FILTER_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'greater_than_or_equal',
  'less_than_or_equal',
  'between',
  'in',
  'not_in',
  'regex',
  'is_null',
  'is_not_null',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterResult {
  data: Record<string, unknown>[];
  count: number;
}
