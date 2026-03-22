export const WIDGET_TYPES = [
  'kpi',
  'card',
  'kpiGroup',
  'bar',
  'line',
  'pie',
  'table',
  'radar',
  'bubble',
  'scatter',
] as const;

export type WidgetTypeValue = (typeof WIDGET_TYPES)[number];
