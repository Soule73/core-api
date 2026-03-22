export interface WidgetResponse {
  _id: string;
  id: string;
  title: string;
  type: string;
  dataSourceId: string;
  config: Record<string, unknown>;
  ownerId: string;
  visibility: string;
  isGeneratedByAI: boolean;
  conversationId?: string;
  isDraft: boolean;
  description?: string;
  reasoning?: string;
  confidence?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
