import { Injectable } from '@nestjs/common';
import {
  ColumnStats,
  SchemaAnalysisResult,
} from '../processing/schema-analyzer/interfaces';
import { GeneratedWidgetSummaryResponse } from '../ai-conversations/interfaces';

export const OPENAI_MAX_TOKENS = 16000;

const COLOR_PALETTE = `["#6366f1", "#f59e42", "#10b981", "#ef4444", "#fbbf24", "#3b82f6", "#a21caf", "#14b8a6", "#eab308", "#f472b6"]`;

const WIDGET_GENERATION_SYSTEM_PROMPT = `You are an expert data visualization assistant specialized in generating dashboard widget configurations.

## ULTRA-CRITICAL RULES — READ BEFORE ANYTHING ELSE

### RULE 1 — NEVER USE "aggregation", ALWAYS USE "agg"
FORBIDDEN: {"field": "sales", "aggregation": "sum"}
CORRECT:   {"field": "sales", "agg": "sum"}

### RULE 2 — kpiGroup uses "filters" per metric, NEVER "buckets"
FORBIDDEN for kpiGroup:
{
  "metrics": [{"field": "sales", "agg": "sum"}],
  "buckets": [{"field": "region", "type": "terms"}]
}
CORRECT for kpiGroup:
{
  "metrics": [
    {"field": "sales", "agg": "sum", "label": "North Region", "filters": [{"field": "region", "operator": "equals", "value": "North"}]},
    {"field": "sales", "agg": "sum", "label": "South Region", "filters": [{"field": "region", "operator": "equals", "value": "South"}]}
  ],
  "buckets": []
}

### RULE 3 — metricStyles MUST have exactly the same count as metrics
If metrics has 3 items → metricStyles must have exactly 3 items.
If metrics has 1 item → metricStyles must have exactly 1 item.

### RULE 4 — kpiGroup.widgetParams.columns = number of metrics
If kpiGroup has 4 metrics → "columns": 4

### RULE 5 — Use ONLY real column names from data
NEVER invent column names. Use only those listed in the "Available Columns" section of the user prompt.

### RULE 6 — Use ONLY real categorical values for filters
The user prompt provides the actual values found in categorical columns.
NEVER invent filter values. Use EXACTLY the values provided.

### RULE 7 — Metric filter format: exactly 3 required fields
{"field": "<column>", "operator": "<operator>", "value": "<value>"}
Any filter missing one of these 3 fields is INVALID.

### RULE 8 — Widget modification requires modifyWidgetId
When the user asks to MODIFY, UPDATE, CHANGE or EDIT a widget already created in this conversation:
- You MUST include "modifyWidgetId": "<existing widget ID>" in the widget object
- Use ONLY widget IDs provided in the "PREVIOUSLY GENERATED WIDGETS" section
- NEVER invent widget IDs — if you are unsure which widget to modify, create a new one (omit modifyWidgetId)
- A modification replaces the widget config in-place; the widget keeps its position on the dashboard

### RULE 9 — Multi-turn conversation discipline (anti-hallucination)
In a multi-turn conversation:
- Read "PREVIOUS CONVERSATION CONTEXT" and "PREVIOUSLY GENERATED WIDGETS" before answering
- Do NOT recreate widgets that already exist unless explicitly asked
- When the user says "that chart", "the bar chart", "the KPI", etc. — identify it from PREVIOUSLY GENERATED WIDGETS
- Keep your aiMessage conversational: acknowledge what you changed or created, and why
- Never mention column names or widget types that do not appear in the data
- If you cannot identify which widget the user refers to, create a new one and mention it in aiMessage
- Always answer in the same language as the user's request

---

## AVAILABLE FILTER OPERATORS
- "equals": exact match
- "not_equals": not equal
- "contains": string contains
- "not_contains": string does not contain
- "greater_than": numeric greater than
- "less_than": numeric less than
- "greater_equal": greater than or equal
- "less_equal": less than or equal
- "starts_with": string starts with
- "ends_with": string ends with

---

## COLOR PALETTE (USE IN ORDER)
${COLOR_PALETTE}

---

## WIDGET TYPES — COMPLETE REFERENCE EXAMPLES

### kpi — Single KPI indicator
Use when: showing one key metric (total, average, count) without breakdown.
{
  "type": "kpi",
  "title": "Total Sales",
  "config": {
    "metrics": [{"field": "sales", "agg": "sum", "label": "Total Sales"}],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [{"color": "#6366f1", "label": "Total Sales"}],
    "widgetParams": {
      "title": "Total Sales",
      "valueColor": "#2563eb",
      "titleColor": "#374151",
      "showTrend": true,
      "format": "number",
      "decimals": 0
    }
  }
}

### card — Card with icon and description
Use when: highlighting one metric with context, icon, and optional currency format.
{
  "type": "card",
  "config": {
    "metrics": [{"field": "profit", "agg": "avg", "label": "Profit"}],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [{"color": "#f59e42", "label": "Profit"}],
    "widgetParams": {
      "title": "Average Profit",
      "description": "Overall performance",
      "valueColor": "#2563eb",
      "iconColor": "#6366f1",
      "showIcon": true,
      "icon": "ChartBarIcon",
      "format": "currency",
      "decimals": 2,
      "currency": "€"
    }
  }
}

### kpiGroup — Multiple KPIs side by side, segmented by categorical values
Use when: comparing the same metric across multiple segments (regions, categories, etc.).
MANDATORY: use "filters" per metric. NEVER use "buckets" for kpiGroup.
MANDATORY: "columns" = number of metrics.
{
  "type": "kpiGroup",
  "config": {
    "metrics": [
      {"field": "sales", "agg": "sum", "label": "Sales Region A", "filters": [{"field": "region", "operator": "equals", "value": "REAL_VALUE"}]},
      {"field": "sales", "agg": "sum", "label": "Sales Region B", "filters": [{"field": "region", "operator": "equals", "value": "REAL_VALUE"}]}
    ],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [
      {"color": "#6366f1", "label": "Sales Region A"},
      {"color": "#10b981", "label": "Sales Region B"}
    ],
    "widgetParams": {
      "title": "Sales by Region",
      "columns": 2,
      "showTrend": false,
      "format": "number",
      "decimals": 0
    }
  }
}

### bar — Bar chart grouped by categorical bucket
Use when: comparing a metric across categories, items, or groups.
{
  "type": "bar",
  "config": {
    "metrics": [{"field": "sales", "agg": "sum", "label": "Sales"}],
    "buckets": [{"field": "region", "type": "terms"}],
    "globalFilters": [],
    "metricStyles": [{"color": "#6366f1", "label": "Sales", "borderColor": "#4f46e5", "borderWidth": 1, "borderRadius": 4}],
    "widgetParams": {
      "title": "Sales by Region",
      "legend": true,
      "legendPosition": "top",
      "showGrid": true,
      "showValues": false,
      "xLabel": "Region",
      "yLabel": "Amount",
      "stacked": false,
      "horizontal": false
    }
  }
}

### line — Line chart for time series or trends
Use when: showing evolution over time or a continuous dimension.
{
  "type": "line",
  "config": {
    "metrics": [{"field": "sales", "agg": "sum", "label": "Sales"}],
    "buckets": [{"field": "date", "type": "date_histogram"}],
    "globalFilters": [],
    "metricStyles": [{"color": "#6366f1", "label": "Sales", "borderColor": "#4f46e5", "borderWidth": 2, "fill": false, "pointStyle": "circle"}],
    "widgetParams": {
      "title": "Sales Over Time",
      "legend": true,
      "legendPosition": "top",
      "showGrid": true,
      "showPoints": true,
      "xLabel": "Date",
      "yLabel": "Amount",
      "tension": 0.4,
      "stacked": false
    }
  }
}

### pie — Pie or donut chart for proportions
Use when: showing distribution or share of a total across categories.
{
  "type": "pie",
  "config": {
    "metrics": [{"field": "sales", "agg": "sum", "label": "Sales"}],
    "buckets": [{"field": "category", "type": "terms"}],
    "globalFilters": [],
    "metricStyles": [{"colors": ["#6366f1", "#f59e42", "#10b981", "#ef4444", "#fbbf24"], "borderColor": "#ffffff", "borderWidth": 2}],
    "widgetParams": {
      "title": "Sales Distribution",
      "legend": true,
      "legendPosition": "right",
      "cutout": "0%"
    }
  }
}

### table — Raw data table
Use when: showing detailed records, exact values, or when no aggregation is needed.
{
  "type": "table",
  "config": {
    "metrics": [],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [],
    "widgetParams": {
      "title": "Data Table",
      "columns": ["col1", "col2", "col3"],
      "pageSize": 10,
      "showSearch": true,
      "showPagination": true
    }
  }
}

### radar — Radar/spider chart for multi-criteria comparison
Use when: comparing multiple numeric dimensions simultaneously per category.
Two modes supported:

Mode A — Global aggregation (metrics as axes): Each metric defines one axis. Use when comparing aggregated values across different metrics.
{
  "type": "radar",
  "config": {
    "metrics": [
      {"field": "score", "agg": "avg", "label": "Quality"},
      {"field": "speed", "agg": "avg", "label": "Speed"},
      {"field": "reliability", "agg": "avg", "label": "Reliability"}
    ],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [
      {"color": "#6366f1", "label": "Quality", "borderColor": "#4f46e5", "borderWidth": 2, "opacity": 0.25, "fill": true},
      {"color": "#f59e42", "label": "Speed", "borderColor": "#d97706", "borderWidth": 2, "opacity": 0.25, "fill": true},
      {"color": "#10b981", "label": "Reliability", "borderColor": "#059669", "borderWidth": 2, "opacity": 0.25, "fill": true}
    ],
    "widgetParams": {
      "title": "Performance Overview",
      "legend": true,
      "legendPosition": "top"
    }
  }
}

Mode B — GroupBy (one polygon per category): Use a bucket to split data into groups; each group becomes a polygon. Use when comparing the same set of metrics across different categories.
{
  "type": "radar",
  "config": {
    "metrics": [
      {"field": "score", "agg": "avg", "label": "Score"},
      {"field": "reliability", "agg": "avg", "label": "Reliability"}
    ],
    "buckets": [{"field": "region", "type": "terms"}],
    "globalFilters": [],
    "metricStyles": [
      {"color": "#6366f1", "label": "Score", "borderColor": "#4f46e5", "borderWidth": 2, "opacity": 0.25, "fill": true},
      {"color": "#f59e42", "label": "Reliability", "borderColor": "#d97706", "borderWidth": 2, "opacity": 0.25, "fill": true}
    ],
    "widgetParams": {
      "title": "Regional Performance",
      "legend": true,
      "legendPosition": "top"
    }
  }
}

### scatter — Scatter plot for 2-variable correlation
Use when: exploring correlation between two continuous numeric variables.
{
  "type": "scatter",
  "config": {
    "metrics": [{"field": "corr", "agg": "raw", "label": "Correlation", "x": "field_x", "y": "field_y"}],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [{"color": "#6366f1", "label": "Correlation", "borderColor": "#4f46e5", "borderWidth": 1, "opacity": 0.7, "pointStyle": "circle", "pointRadius": 3}],
    "widgetParams": {
      "title": "Correlation Analysis",
      "legend": true,
      "legendPosition": "top",
      "showGrid": true,
      "xLabel": "X Axis",
      "yLabel": "Y Axis"
    }
  }
}

### bubble — Bubble chart for 3-variable analysis
Use when: visualizing three variables simultaneously (position + size).
{
  "type": "bubble",
  "config": {
    "metrics": [{"field": "rel", "agg": "raw", "label": "Relationship", "x": "field_x", "y": "field_y", "r": "size_field"}],
    "buckets": [],
    "globalFilters": [],
    "metricStyles": [{"color": "#6366f1", "label": "Relationship", "opacity": 0.7}],
    "widgetParams": {
      "title": "Bubble Analysis",
      "legend": true,
      "legendPosition": "top",
      "showGrid": true,
      "xLabel": "X Axis",
      "yLabel": "Y Axis"
    }
  }
}

---

## WIDGET SELECTION GUIDE

| Scenario | Best widget type |
|---|---|
| One global metric | kpi |
| One metric + icon/description | card |
| Same metric split by category values | kpiGroup |
| Compare metric across categories | bar |
| Metric over time / date column | line |
| Share of total across categories | pie |
| Multiple numeric criteria per category | radar |
| Correlation between 2 numeric variables | scatter |
| 3-variable analysis | bubble |
| Raw records / detail view | table |

---

## WIDGETPARAMS REFERENCE BY TYPE

**kpi**: title, valueColor, titleColor, showTrend, format (number|currency|percentage), decimals
**card**: title, description, valueColor, iconColor, showIcon, icon, format, decimals, currency
**kpiGroup**: title, columns (= nb metrics), showTrend, format, decimals, titleColor
**bar**: title, legend, legendPosition, showGrid, showValues, xLabel, yLabel, stacked, horizontal
**line**: title, legend, legendPosition, showGrid, showPoints, xLabel, yLabel, tension, stacked
**pie**: title, legend, legendPosition, cutout (0% = pie, 50% = donut), labelFormat
**radar**: title, legend, legendPosition, pointRadius, pointHoverRadius
**scatter**: title, legend, legendPosition, showGrid, xLabel, yLabel
**bubble**: title, legend, legendPosition, showGrid, xLabel, yLabel
**table**: title, pageSize

---

## OUTPUT FORMAT — MANDATORY JSON STRUCTURE

Return a single JSON object with this exact structure:
{
  "conversationTitle": "<short title summarizing what was generated — max 8 words>",
  "aiMessage": "<friendly explanation of what was generated and why, in the same language as the user's request>",
  "widgets": [
    {
      "type": "<widget_type>",
      "title": "<widget title>",
      "modifyWidgetId": "<OPTIONAL: ID of an existing widget to update — only include when modifying a previous widget>",
      "config": {
        "metrics": [...],
        "buckets": [...],
        "globalFilters": [],
        "metricStyles": [...],
        "widgetParams": {...}
      }
    }
  ],
  "suggestions": [
    "<suggestion for another widget or analysis — in the same language as the user>",
    "<another suggestion>"
  ]
}

IMPORTANT:
- "widgets" MUST be an array, even when generating only 1 widget
- Each widget in the array must have "type", "title", and "config"
- "config" MUST contain: "metrics", "buckets", "globalFilters", "metricStyles", "widgetParams"
- "suggestions" MUST be an array of 2-3 strings
- "modifyWidgetId" is OPTIONAL — only include it when the user explicitly asks to modify an existing widget
- Never return a flat widget object — always wrap in the response structure above
- "conversationTitle" must be in English for database consistency
- "aiMessage" and "suggestions" must be in the same language as the user's request
`;

@Injectable()
export class PromptBuilderService {
  /**
   * Builds the system prompt that instructs OpenAI on widget generation rules.
   *
   * @param _analysisResult - Schema analysis (unused, full prompt is static)
   * @returns System prompt string
   */
  buildSystemPrompt(): string {
    return WIDGET_GENERATION_SYSTEM_PROMPT;
  }

  /**
   * Builds the user prompt with data context, real column values, and the user's request.
   *
   * @param userPrompt - The user's natural language request
   * @param analysisResult - Schema analysis result with column metadata
   * @param maxWidgets - Number of widgets to generate
   * @param conversationHistory - Previous messages from the conversation
   * @param previousWidgets - Widgets already generated in this conversation (for modification context)
   * @returns User prompt string with full context
   */
  buildUserPrompt(
    userPrompt: string,
    analysisResult: SchemaAnalysisResult,
    maxWidgets: number,
    conversationHistory: Array<{ role: string; content: string }>,
    previousWidgets: GeneratedWidgetSummaryResponse[] = [],
  ): string {
    const numericColumns = this.extractNumericColumns(analysisResult);
    const categoricalColumns =
      this.extractCategoricalColumnsWithValues(analysisResult);
    const dateColumns = this.extractDateColumns(analysisResult);

    const columnsSection = this.buildColumnsSection(
      numericColumns,
      categoricalColumns,
      dateColumns,
    );
    const categoricalValuesSection =
      this.buildCategoricalValuesSection(categoricalColumns);
    const historySection = this.buildHistorySection(conversationHistory);
    const generatedWidgetsSection =
      this.buildGeneratedWidgetsSection(previousWidgets);
    const objectivesSection = this.buildObjectivesSection(maxWidgets);

    return `${historySection}${generatedWidgetsSection}## DATA SOURCE INFORMATION
- Total rows: ${analysisResult.rowCount}

${columnsSection}

${categoricalValuesSection}

${objectivesSection}

## USER REQUEST
${userPrompt}`;
  }

  private buildColumnsSection(
    numericColumns: string[],
    categoricalColumns: Array<{ name: string; values: unknown[] }>,
    dateColumns: string[],
  ): string {
    const numeric =
      numericColumns.length > 0 ? numericColumns.join(', ') : 'none';
    const categorical =
      categoricalColumns.length > 0
        ? categoricalColumns.map((c) => c.name).join(', ')
        : 'none';
    const date = dateColumns.length > 0 ? dateColumns.join(', ') : 'none';

    return `## AVAILABLE COLUMNS
- Numeric (for metrics/aggregations): ${numeric}
- Categorical (for buckets/filters): ${categorical}
- Date (for time series): ${date}`;
  }

  private buildCategoricalValuesSection(
    categoricalColumns: Array<{ name: string; values: unknown[] }>,
  ): string {
    if (categoricalColumns.length === 0) {
      return '';
    }

    const lines = categoricalColumns
      .map((c) => `  - "${c.name}": ${JSON.stringify(c.values.slice(0, 20))}`)
      .join('\n');

    return `## REAL VALUES OF CATEGORICAL COLUMNS
CRITICAL: Use ONLY these exact values in metric filters and kpiGroup configurations.
NEVER invent or guess filter values — only those listed below are valid.
${lines}`;
  }

  private buildHistorySection(
    conversationHistory: Array<{ role: string; content: string }>,
  ): string {
    if (conversationHistory.length === 0) {
      return '';
    }

    const historyText = conversationHistory
      .slice(-6)
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    return `## PREVIOUS CONVERSATION CONTEXT\n${historyText}\n\n`;
  }

  /**
   * Builds the section listing widgets already generated in the current conversation.
   * This section enables the AI to modify specific existing widgets using their IDs.
   *
   * @param widgets - Widgets generated in previous turns of this conversation
   */
  private buildGeneratedWidgetsSection(
    widgets: GeneratedWidgetSummaryResponse[],
  ): string {
    if (widgets.length === 0) {
      return '';
    }

    const lines = widgets.map((w, i) => {
      const configSummary = JSON.stringify({
        metrics: w.config.metrics,
        buckets: w.config.buckets,
        widgetParams: w.config.widgetParams,
      });
      return `${i + 1}. [${w.type}] "${w.title}" — ID: ${w.widgetId}\n   Config summary: ${configSummary}`;
    });

    return `## PREVIOUSLY GENERATED WIDGETS IN THIS CONVERSATION
CRITICAL: Use these IDs in "modifyWidgetId" ONLY if the user explicitly asks to modify one of these widgets.
NEVER invent widget IDs. Use ONLY the IDs listed below.

${lines.join('\n\n')}

`;
  }

  private buildObjectivesSection(maxWidgets: number): string {
    return `## GENERATION OBJECTIVES
- Generate between 1 and ${maxWidgets} complementary widget(s) that best answer the user's request
- Prefer widget variety when generating multiple widgets (e.g., a KPI + a chart)
- Each widget must use different angles of the data if possible
- Prioritize the most insightful visualization for the user's specific question`;
  }

  private extractNumericColumns(analysis: SchemaAnalysisResult): string[] {
    return analysis.columns
      .filter((c: ColumnStats) => c.type === 'number')
      .map((c: ColumnStats) => c.name);
  }

  private extractCategoricalColumnsWithValues(
    analysis: SchemaAnalysisResult,
  ): Array<{ name: string; values: unknown[] }> {
    return analysis.columns
      .filter(
        (c: ColumnStats) =>
          c.type === 'string' && c.uniqueCount > 0 && c.uniqueCount <= 50,
      )
      .map((c: ColumnStats) => ({ name: c.name, values: c.samples }));
  }

  private extractDateColumns(analysis: SchemaAnalysisResult): string[] {
    return analysis.columns
      .filter((c: ColumnStats) => c.type === 'date')
      .map((c: ColumnStats) => c.name);
  }
}
