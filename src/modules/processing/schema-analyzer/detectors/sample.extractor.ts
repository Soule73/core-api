import { Injectable } from '@nestjs/common';

@Injectable()
export class SampleExtractor {
  extractSamples(values: unknown[], sampleSize: number = 5): unknown[] {
    const nonNullValues = values.filter(
      (v) => v !== null && v !== undefined && v !== '',
    );

    if (nonNullValues.length <= sampleSize) {
      return [...nonNullValues];
    }

    const uniqueSamples = this.getUniqueSamples(nonNullValues, sampleSize);
    if (uniqueSamples.length >= sampleSize) {
      return uniqueSamples.slice(0, sampleSize);
    }

    return this.getDistributedSamples(nonNullValues, sampleSize);
  }

  extractMinMax(values: unknown[]): { min?: number; max?: number } {
    let min: number | undefined;
    let max: number | undefined;

    for (const value of values) {
      const num = this.toNumber(value);
      if (num !== null) {
        if (min === undefined || num < min) min = num;
        if (max === undefined || num > max) max = num;
      }
    }

    return { min, max };
  }

  calculateAverage(values: unknown[]): number | undefined {
    let sum = 0;
    let count = 0;

    for (const value of values) {
      const num = this.toNumber(value);
      if (num !== null) {
        sum += num;
        count++;
      }
    }

    return count > 0 ? sum / count : undefined;
  }

  private getUniqueSamples(values: unknown[], maxCount: number): unknown[] {
    const seen = new Set<string>();
    const samples: unknown[] = [];

    for (const value of values) {
      const key = String(value);
      if (!seen.has(key)) {
        seen.add(key);
        samples.push(value);
        if (samples.length >= maxCount) break;
      }
    }

    return samples;
  }

  private getDistributedSamples(
    values: unknown[],
    sampleSize: number,
  ): unknown[] {
    const step = Math.floor(values.length / sampleSize);
    const samples: unknown[] = [];

    for (let i = 0; i < sampleSize; i++) {
      samples.push(values[i * step]);
    }

    return samples;
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }
}
