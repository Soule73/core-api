/**
 * Test interfaces for typing API responses in E2E tests.
 */

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  _id: string;
  id: string;
  username: string;
  email: string;
  roleId: string;
  role?: RoleResponse;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleResponse {
  _id: string;
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardResponse {
  _id: string;
  id: string;
  title: string;
  ownerId: string;
  visibility: 'private' | 'public';
  layout: LayoutItem[];
  isShared: boolean;
  shareId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutItem {
  i: string;
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DataSourceResponse {
  _id: string;
  id: string;
  name: string;
  type: 'json' | 'csv' | 'elasticsearch';
  ownerId: string;
  endpoint?: string;
  filePath?: string;
  config?: Record<string, unknown>;
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface WidgetResponse {
  _id: string;
  id: string;
  widgetId: string;
  title: string;
  type: string;
  dataSourceId: string;
  ownerId: string;
  config: Record<string, unknown>;
  visibility: 'private' | 'public';
  isAIGenerated?: boolean;
  aiMetadata?: AIMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface AIMetadata {
  reasoning?: string;
  confidence?: number;
  conversationId?: string;
}

export interface AIConversationResponse {
  _id: string;
  id: string;
  title: string;
  dataSourceId: string;
  ownerId: string;
  messages: AIMessage[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}
