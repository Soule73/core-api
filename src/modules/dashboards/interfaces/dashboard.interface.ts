export interface LayoutItemStylesResponse {
  backgroundColor?: string;
  backgroundGradient?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  boxShadow?: string;
  padding?: string;
  textColor?: string;
  labelColor?: string;
  gridColor?: string;
}

export interface DashboardStylesResponse {
  backgroundColor?: string;
  backgroundGradient?: string;
  padding?: string;
  gap?: string;
  titleFontSize?: string;
  titleColor?: string;
}

export interface DashboardLayoutItemResponse {
  i: string;
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  styles?: LayoutItemStylesResponse;
}

export interface DashboardTimeRangeResponse {
  from?: Date;
  to?: Date;
  intervalValue?: number;
  intervalUnit?: string;
}

export interface DashboardFilterResponse {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean | (string | number)[];
}

export interface DashboardResponse {
  _id: string;
  id: string;
  title: string;
  description?: string;
  layout: DashboardLayoutItemResponse[];
  styles?: DashboardStylesResponse;
  ownerId: string;
  visibility: string;
  shareEnabled: boolean;
  isShared: boolean;
  shareId?: string | null;
  autoRefreshIntervalValue?: number;
  autoRefreshIntervalUnit?: string;
  timeRange?: DashboardTimeRangeResponse;
  globalFilters: DashboardFilterResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}
