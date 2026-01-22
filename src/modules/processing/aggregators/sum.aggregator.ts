import { Injectable } from '@nestjs/common';
import { IAggregator, AggregationType } from './aggregator.interface';

@Injectable()
export class SumAggregator implements IAggregator {
  getType(): AggregationType {
    return 'sum';
  }

  aggregate(values: unknown[]): number {
    let sum = 0;
    for (const val of values) {
      const num = this.toNumber(val);
      sum += num ?? 0;
    }
    return sum;
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
