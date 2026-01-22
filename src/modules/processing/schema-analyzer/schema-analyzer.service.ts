import { Injectable, Logger } from '@nestjs/common';
import { TypeDetector } from './detectors/type.detector';
import { CardinalityDetector } from './detectors/cardinality.detector';
import { SampleExtractor } from './detectors/sample.extractor';
import {
  ColumnStats,
  SchemaAnalysisResult,
  AnalysisOptions,
  DEFAULT_ANALYSIS_OPTIONS,
} from './interfaces';

type DataRecord = Record<string, unknown>;

@Injectable()
export class SchemaAnalyzerService {
  private readonly logger = new Logger(SchemaAnalyzerService.name);

  constructor(
    private readonly typeDetector: TypeDetector,
    private readonly cardinalityDetector: CardinalityDetector,
    private readonly sampleExtractor: SampleExtractor,
  ) {
    /** */
  }

  analyzeSchema(
    data: DataRecord[],
    options: AnalysisOptions = {},
  ): SchemaAnalysisResult {
    const mergedOptions = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };

    if (!data || data.length === 0) {
      return {
        columns: [],
        rowCount: 0,
        analyzedAt: new Date(),
      };
    }

    const columnNames = this.extractColumnNames(data);
    const columns = columnNames.map((name) =>
      this.analyzeColumn(name, data, mergedOptions),
    );

    this.logger.debug(
      `Analyzed ${columns.length} columns from ${data.length} rows`,
    );

    return {
      columns,
      rowCount: data.length,
      analyzedAt: new Date(),
    };
  }

  analyzeColumn(
    columnName: string,
    data: DataRecord[],
    options: AnalysisOptions,
  ): ColumnStats {
    const values = data.map((row) => row[columnName]);

    const type = this.typeDetector.inferColumnType(values);
    const cardinality = this.cardinalityDetector.calculate(
      values,
      options.maxUniqueValues,
    );
    const samples = this.sampleExtractor.extractSamples(
      values,
      options.sampleSize,
    );

    const nullCount = values.filter(
      (v) => v === null || v === undefined,
    ).length;
    const emptyCount = values.filter(
      (v) => v === '' || v === null || v === undefined,
    ).length;

    const stats: ColumnStats = {
      name: columnName,
      type,
      nullable: nullCount > 0,
      uniqueCount: cardinality.uniqueCount,
      totalCount: cardinality.totalCount,
      cardinality: cardinality.cardinality,
      samples,
      emptyCount,
    };

    if (type === 'number') {
      const minMax = this.sampleExtractor.extractMinMax(values);
      const avg = this.sampleExtractor.calculateAverage(values);
      stats.minValue = minMax.min;
      stats.maxValue = minMax.max;
      stats.avgValue = avg;
    }

    if (type === 'date' || type === 'string') {
      const nonEmpty = values.filter(
        (v) => v !== null && v !== undefined && v !== '',
      );
      if (nonEmpty.length > 0) {
        const sorted = [...nonEmpty].sort();
        stats.minValue = sorted[0] as string;
        stats.maxValue = sorted[sorted.length - 1] as string;
      }
    }

    return stats;
  }

  quickAnalyze(data: DataRecord[]): Array<{ name: string; type: string }> {
    if (!data || data.length === 0) return [];

    const columnNames = this.extractColumnNames(data);
    const sampleSize = Math.min(100, data.length);
    const sampleData = data.slice(0, sampleSize);

    return columnNames.map((name) => {
      const values = sampleData.map((row) => row[name]);
      const type = this.typeDetector.inferColumnType(values);
      return { name, type };
    });
  }

  private extractColumnNames(data: DataRecord[]): string[] {
    const columnSet = new Set<string>();

    for (const row of data.slice(0, 100)) {
      for (const key of Object.keys(row)) {
        columnSet.add(key);
      }
    }

    return Array.from(columnSet);
  }
}
