import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CalendarJobProcessor } from '../modules/google-calendar/workers/calendar-job-processor';

async function bootstrap() {
  console.log('🚀 Starting TampilKit Google Calendar Outbox Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  const worker = app.get(CalendarJobProcessor);
  worker.start();

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down Calendar Worker gracefully...`);
    worker.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log('✅ Calendar Worker is running. Press Ctrl+C to exit.');
}

bootstrap().catch((err) => {
  console.error('Fatal error in Calendar Worker:', err);
  process.exit(1);
});
