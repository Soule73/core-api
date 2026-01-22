import { Injectable } from '@nestjs/common';

export interface CardinalityResult {
  uniqueCount: number;
  totalCount: number;
  cardinality: number;
  isHighCardinality: boolean;
}

@Injectable()
export class CardinalityDetector {
  private readonly HIGH_CARDINALITY_THRESHOLD = 0.8;

  calculate(
    values: unknown[],
    maxUniqueValues: number = 1000,
  ): CardinalityResult {
    const seen = new Set<string>();
    let totalCount = 0;

    for (const value of values) {
      totalCount++;

      if (seen.size < maxUniqueValues) {
        const key = this.toKey(value);
        seen.add(key);
      }
    }

    const uniqueCount = seen.size;
    const cardinality = totalCount > 0 ? uniqueCount / totalCount : 0;

    return {
      uniqueCount,
      totalCount,
      cardinality,
      isHighCardinality: cardinality >= this.HIGH_CARDINALITY_THRESHOLD,
    };
  }

  getUniqueValues(values: unknown[], maxCount: number = 100): unknown[] {
    const seen = new Set<string>();
    const result: unknown[] = [];

    for (const value of values) {
      const key = this.toKey(value);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(value);
        if (result.length >= maxCount) break;
      }
    }

    return result;
  }

  private toKey(value: unknown): string {
    if (value === null) return '__null__';
    if (value === undefined) return '__undefined__';
    if (typeof value === 'object' && value !== null)
      return JSON.stringify(value);
    if (typeof value === 'symbol') return value.toString();
    if (typeof value === 'function') return '__function__';
    return String(value as string | number | boolean | bigint);
  }
}
