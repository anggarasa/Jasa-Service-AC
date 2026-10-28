import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { DependencyStatus } from '@tampilkit-ac/api-contract';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['error', 'warn']
          : ['error'],
    });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn(
        'DATABASE_URL is not set. Database operations will remain disconnected.',
      );
      return;
    }

    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL database successfully.');
    } catch (err: unknown) {
      this.isConnected = false;
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Could not connect to PostgreSQL database on boot: ${msg}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.isConnected = false;
      this.logger.log('Disconnected from PostgreSQL database.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Error disconnecting from PostgreSQL: ${msg}`);
    }
  }

  async checkDatabaseHealth(): Promise<DependencyStatus> {
    if (!process.env.DATABASE_URL) {
      return 'unconfigured';
    }

    try {
      // Execute a lightweight query to verify active connectivity
      await this.$queryRawUnsafe('SELECT 1');
      this.isConnected = true;
      return 'connected';
    } catch {
      this.isConnected = false;
      return 'disconnected';
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
