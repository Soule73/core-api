import { Injectable, Logger } from '@nestjs/common';
import { IAggregator, AggregationType } from './aggregator.interface';
import { SumAggregator } from './sum.aggregator';
import { AvgAggregator } from './avg.aggregator';
import { CountAggregator } from './count.aggregator';
import { MinAggregator } from './min.aggregator';
import { MaxAggregator } from './max.aggregator';

@Injectable()
export class AggregatorFactory {
  private readonly logger = new Logger(AggregatorFactory.name);
  private readonly aggregators: Map<AggregationType, IAggregator>;

  constructor(
    private readonly sumAggregator: SumAggregator,
    private readonly avgAggregator: AvgAggregator,
    private readonly countAggregator: CountAggregator,
    private readonly minAggregator: MinAggregator,
    private readonly maxAggregator: MaxAggregator,
  ) {
    this.aggregators = new Map<AggregationType, IAggregator>();
    this.aggregators.set('sum', this.sumAggregator);
    this.aggregators.set('avg', this.avgAggregator);
    this.aggregators.set('count', this.countAggregator);
    this.aggregators.set('min', this.minAggregator);
    this.aggregators.set('max', this.maxAggregator);
  }

  getAggregator(type: AggregationType): IAggregator {
    const aggregator = this.aggregators.get(type);

    if (!aggregator) {
      this.logger.error(`No aggregator found for type: ${type}`);
      throw new Error(`Unsupported aggregation type: ${type}`);
    }

    return aggregator;
  }

  getSupportedTypes(): AggregationType[] {
    return Array.from(this.aggregators.keys());
  }

  aggregate(type: AggregationType, values: unknown[]): number | string | null {
    const aggregator = this.getAggregator(type);
    return aggregator.aggregate(values);
  }
}
