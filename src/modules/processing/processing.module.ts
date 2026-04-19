import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

import { ProcessingController } from './processing.controller';

import { DataFetcherService } from './services/data-fetcher.service';
import { DataProcessorService } from './services/data-processor.service';

import { ConnectorFactory } from './connectors/connector.factory';
import { JsonConnector } from './connectors/json.connector';
import { CsvConnector } from './connectors/csv.connector';
import { ElasticsearchConnector } from './connectors/elasticsearch.connector';

import { AggregatorFactory } from './aggregators/aggregator.factory';
import { SumAggregator } from './aggregators/sum.aggregator';
import { AvgAggregator } from './aggregators/avg.aggregator';
import { CountAggregator } from './aggregators/count.aggregator';
import { MinAggregator } from './aggregators/min.aggregator';
import { MaxAggregator } from './aggregators/max.aggregator';

import { FilterEngine } from './filters/filter.engine';

import { GroupByTransformer } from './transformers/group-by.transformer';

import { SchemaAnalyzerService } from './schema-analyzer/schema-analyzer.service';
import { TypeDetector } from './schema-analyzer/detectors/type.detector';
import { CardinalityDetector } from './schema-analyzer/detectors/cardinality.detector';
import { SampleExtractor } from './schema-analyzer/detectors/sample.extractor';

import {
  DataSource,
  DataSourceSchema,
} from '../datasources/schemas/datasource.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DataSource.name, schema: DataSourceSchema },
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('redis.host', 'localhost');
        const port = config.get<number>('redis.port', 6379);
        const password = config.get<string | undefined>('redis.password');
        const tls = config.get<boolean>('redis.tls', false);
        const ttl = config.get<number>('redis.ttl', 300000);

        const redisUrl = `redis${tls ? 's' : ''}://:${password}@${host}:${port}`;

        return {
          ttl,
          stores: [
            new Keyv({
              store: new KeyvRedis(redisUrl),
            }),
          ],
        };
      },
    }),
  ],
  controllers: [ProcessingController],
  providers: [
    DataFetcherService,
    DataProcessorService,
    ConnectorFactory,
    JsonConnector,
    CsvConnector,
    ElasticsearchConnector,
    AggregatorFactory,
    SumAggregator,
    AvgAggregator,
    CountAggregator,
    MinAggregator,
    MaxAggregator,
    FilterEngine,
    GroupByTransformer,
    SchemaAnalyzerService,
    TypeDetector,
    CardinalityDetector,
    SampleExtractor,
  ],
  exports: [
    DataFetcherService,
    DataProcessorService,
    SchemaAnalyzerService,
    ConnectorFactory,
    AggregatorFactory,
    FilterEngine,
    GroupByTransformer,
  ],
})
export class ProcessingModule {
  /** */
}
