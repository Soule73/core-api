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
}

export interface DashboardTimeRangeResponse {
  from?: Date;
  to?: Date;
  intervalValue?: number;
  intervalUnit?: string;
}

export interface DashboardResponse {
  _id: string;
  id: string;
  title: string;
  description?: string;
  layout: DashboardLayoutItemResponse[];
  ownerId: string;
  visibility: string;
  shareEnabled: boolean;
  isShared: boolean;
  shareId?: string | null;
  autoRefreshIntervalValue?: number;
  autoRefreshIntervalUnit?: string;
  timeRange?: DashboardTimeRangeResponse;
  createdAt?: Date;
  updatedAt?: Date;
}
