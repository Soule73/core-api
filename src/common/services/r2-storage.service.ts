import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);
  private readonly accountId?: string;
  private readonly accessKeyId?: string;
  private readonly secretAccessKey?: string;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    this.accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    this.secretAccessKey = this.configService.get<string>(
      'R2_SECRET_ACCESS_KEY',
    );
    this.bucketName = this.configService.get<string>(
      'R2_BUCKET_NAME',
      'customdash-uploads',
    );
  }

  get isConfigured(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const client = this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    this.logger.log(`Uploaded file to R2: ${key}`);
    return key;
  }

  async download(key: string): Promise<Buffer> {
    const client = this.getClient();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );

    const body = response.Body;
    if (!body) {
      throw new Error(`Empty object body for key: ${key}`);
    }

    if (body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk));
        } else {
          chunks.push(Buffer.from(chunk as Uint8Array<ArrayBufferLike>));
        }
      }
      return Buffer.concat(chunks);
    }

    const unknownBody = body as unknown;
    if (
      typeof unknownBody === 'object' &&
      unknownBody !== null &&
      'transformToByteArray' in unknownBody
    ) {
      const bytes = await (
        unknownBody as { transformToByteArray: () => Promise<Uint8Array> }
      ).transformToByteArray();
      return Buffer.from(bytes);
    }

    throw new Error(`Unsupported R2 response body type for key: ${key}`);
  }

  async delete(key: string): Promise<void> {
    const client = this.getClient();
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    this.logger.log(`Deleted file from R2: ${key}`);
  }

  private getClient(): S3Client {
    if (!this.isConfigured) {
      throw new Error('Cloudflare R2 is not configured');
    }

    return new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId!,
        secretAccessKey: this.secretAccessKey!,
      },
    });
  }
}
