import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import { DependencyStatus } from '@tampilkit-ac/api-contract';

export type AllowedStoragePath =
  | 'business/logos/'
  | 'services/images/'
  | 'gallery/images/'
  | 'ac-units/photos/'
  | 'work-orders/before/'
  | 'work-orders/after/';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client | null = null;
  private readonly bucket: string;
  private isConfigured = false;

  constructor(@Optional() private readonly config?: ConfigService) {
    this.bucket =
      this.config?.get<string>('MINIO_BUCKET') ||
      process.env.MINIO_BUCKET ||
      'tampilkit-ac-booking';

    const endPoint =
      this.config?.get<string>('MINIO_ENDPOINT') ||
      process.env.MINIO_ENDPOINT ||
      'localhost';
    const port = Number(
      this.config?.get<number>('MINIO_PORT') ||
        process.env.MINIO_PORT ||
        9000,
    );
    const useSSL =
      this.config?.get<boolean>('MINIO_USE_SSL') === true ||
      process.env.MINIO_USE_SSL === 'true';
    const accessKey =
      this.config?.get<string>('MINIO_ACCESS_KEY') ||
      process.env.MINIO_ACCESS_KEY;
    const secretKey =
      this.config?.get<string>('MINIO_SECRET_KEY') ||
      process.env.MINIO_SECRET_KEY;

    if (accessKey && secretKey) {
      try {
        this.client = new Minio.Client({
          endPoint,
          port,
          useSSL,
          accessKey,
          secretKey,
        });
        this.isConfigured = true;
        this.logger.log(`MinIO client initialized for endpoint ${endPoint}:${port}`);
      } catch (err: unknown) {
        this.client = null;
        this.isConfigured = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to initialize MinIO client: ${msg}`);
      }
    } else {
      this.logger.warn(
        'MINIO_ACCESS_KEY or MINIO_SECRET_KEY not set. Storage service operates in fallback mode.',
      );
    }
  }

  async onModuleInit() {
    if (this.isConfigured && this.client) {
      try {
        await this.ensureBucket();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`MinIO connection check on boot failed: ${msg}`);
      }
    }
  }

  async ensureBucket(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
        this.logger.log(`Created private bucket: ${this.bucket}`);
      }
      return true;
    } catch {
      return false;
    }
  }

  async uploadObject(
    folder: AllowedStoragePath,
    fileBuffer: Buffer,
    fileName: string,
    mimeType = 'image/webp',
  ): Promise<{ objectKey: string; url?: string }> {
    const ext = fileName.includes('.') ? fileName.split('.').pop() : 'webp';
    const safeKey = `${folder}${randomUUID()}.${ext}`;

    if (this.client) {
      await this.client.putObject(this.bucket, safeKey, fileBuffer, fileBuffer.length, {
        'Content-Type': mimeType,
      });
    } else {
      this.logger.warn(`[Mock Storage] File ${safeKey} recorded (MinIO offline)`);
    }

    return { objectKey: safeKey };
  }

  async getObjectMetadata(objectKey: string): Promise<Minio.ItemBucketMetadata> {
    if (!this.client) {
      return {};
    }
    const stat = await this.client.statObject(this.bucket, objectKey);
    return stat.metaData;
  }

  async deleteObject(objectKey: string): Promise<void> {
    if (!this.client) return;
    await this.client.removeObject(this.bucket, objectKey);
  }

  async getPresignedDownloadUrl(
    objectKey: string,
    expirySeconds = 3600,
  ): Promise<string> {
    if (!this.client) {
      return `/api/v1/public/media/stream?key=${encodeURIComponent(objectKey)}`;
    }
    return this.client.presignedGetObject(this.bucket, objectKey, expirySeconds);
  }

  async checkStorageHealth(): Promise<DependencyStatus> {
    if (!this.isConfigured || !this.client) {
      return 'unconfigured';
    }

    try {
      await this.client.bucketExists(this.bucket);
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  getClient(): Minio.Client | null {
    return this.client;
  }

  getBucketName(): string {
    return this.bucket;
  }
}
