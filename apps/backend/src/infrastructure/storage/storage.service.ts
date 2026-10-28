import { Injectable, Logger, OnModuleInit, Optional, BadRequestException } from '@nestjs/common';
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
  | 'work-orders/after/'
  | 'work-orders/photos/'
  | 'work-orders/photos/before/'
  | 'work-orders/photos/during/'
  | 'work-orders/photos/after/'
  | 'work-orders/photos/issue/'
  | 'payments/proofs/'
  | 'approvals/evidence/';

export interface ValidatedImageInfo {
  buffer: Buffer;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  size: number;
}

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

  validateImage(buffer: Buffer, declaredMimeType?: string): ValidatedImageInfo {
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('File tidak boleh kosong.');
    }
    if (buffer.length > MAX_SIZE) {
      throw new BadRequestException('Ukuran file melebihi batas maksimal 5 MB.');
    }

    // Reject SVG by string / header inspection
    const headerPrefix = buffer.slice(0, 100).toString('utf-8').toLowerCase();
    if (headerPrefix.includes('<svg') || headerPrefix.includes('<?xml')) {
      throw new BadRequestException('Format berkas SVG tidak diizinkan demi keamanan.');
    }

    // Inspect magic bytes
    // JPEG: FF D8 FF
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return {
        buffer,
        mimeType: 'image/jpeg',
        extension: 'jpg',
        size: buffer.length,
      };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return {
        buffer,
        mimeType: 'image/png',
        extension: 'png',
        size: buffer.length,
      };
    }

    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (
      buffer.length >= 12 &&
      buffer[0] === 0x52 && // R
      buffer[1] === 0x49 && // I
      buffer[2] === 0x46 && // F
      buffer[3] === 0x46 && // F
      buffer[8] === 0x57 && // W
      buffer[9] === 0x45 && // E
      buffer[10] === 0x42 && // B
      buffer[11] === 0x50 // P
    ) {
      return {
        buffer,
        mimeType: 'image/webp',
        extension: 'webp',
        size: buffer.length,
      };
    }

    throw new BadRequestException('Format berkas tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.');
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

  async getObjectStream(objectKey: string): Promise<NodeJS.ReadableStream | null> {
    if (!this.client) return null;
    try {
      return await this.client.getObject(this.bucket, objectKey);
    } catch {
      return null;
    }
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
    try {
      await this.client.removeObject(this.bucket, objectKey);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not delete object ${objectKey} from MinIO: ${msg}`);
    }
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
