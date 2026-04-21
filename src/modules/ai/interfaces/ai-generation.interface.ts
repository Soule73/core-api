import { WidgetResponse } from '../../widgets/interfaces';

export interface AIGenerationResult {
  widgets: WidgetResponse[];
  conversationId: string;
  conversationTitle: string;
  aiMessage: string;
  suggestions: string[];
}

export interface ParsedWidgetConfig {
  type: string;
  title: string;
  modifyWidgetId?: string;
  description?: string;
  reasoning?: string;
  confidence?: number;
  config: Record<string, unknown>;
}
