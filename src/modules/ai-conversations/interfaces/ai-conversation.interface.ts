export interface GeneratedWidgetSummaryResponse {
  widgetId: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
}

export interface AIMessageResponse {
  role: string;
  content: string;
  timestamp: Date;
  widgetsGenerated?: number;
}

export interface ColumnSummaryResponse {
  name: string;
  type: string;
  uniqueValues?: number;
  sampleValues?: unknown[];
}

export interface DataSourceSummaryResponse {
  totalRows: number;
  columns: ColumnSummaryResponse[];
}

export interface AIConversationResponse {
  _id: string;
  id: string;
  userId: string;
  dataSourceId: string;
  title: string;
  messages: AIMessageResponse[];
  dataSourceSummary?: DataSourceSummaryResponse;
  suggestions?: string[];
  generatedWidgets?: GeneratedWidgetSummaryResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}
