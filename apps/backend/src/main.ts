import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const fastifyAdapter = new FastifyAdapter({
    logger: process.env.NODE_ENV === 'development',
    trustProxy: true,
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
  );

  // Security Headers
  await app.register(fastifyHelmet as unknown as any, {
    contentSecurityPolicy: false, // Allows Swagger UI to render smoothly
  });

  // Cookies
  await app.register(fastifyCookie as unknown as any);

  // Multipart File Uploads (Max 5MB)
  await app.register(fastifyMultipart as unknown as any, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1,
    },
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Request Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // CORS Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-Correlation-Id',
    ],
  });

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TampilKit AC Booking API')
    .setDescription(
      'Dokumentasi API Sistem Pemesanan dan Manajemen Layanan Lapangan (Field Service) CoolCare AC Service — Phase 01 to Phase 03.',
    )
    .setVersion('3.0.0')
    .addTag('Health', 'Pemeriksaan status dan kesiapan sistem')
    .addTag('Admin Business', 'Manajemen profil bisnis dan pengaturan booking')
    .addTag('Admin Operating Hours', 'Manajemen jam operasional dan istirahat mingguan')
    .addTag('Admin Closures', 'Manajemen hari libur dan penutupan operasional')
    .addTag('Admin Categories', 'Manajemen kategori layanan servis AC')
    .addTag('Admin Services', 'Manajemen katalog dan harga layanan AC')
    .addTag('Admin Service Areas', 'Manajemen cakupan wilayah kerja dan ongkos kunjungan')
    .addTag('Admin Media & Gallery', 'Pengunggahan media MinIO dan galeri publik')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT Access Token untuk otorisasi admin',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Graceful Shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 Backend NestJS Fastify running on: http://${host}:${port}`);
  logger.log(`📚 Swagger documentation available at: http://${host}:${port}/api/docs`);
  logger.log(`🩺 Health endpoint available at: http://${host}:${port}/api/v1/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during backend bootstrap:', err);
  process.exit(1);
});
