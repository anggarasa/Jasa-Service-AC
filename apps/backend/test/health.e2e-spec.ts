import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module';

describe('HealthController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/health (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.payload);
    expect(body.success).toBe(true);
    expect(body.data.application).toBe('tampilkit-ac-booking');
    expect(body.data.dependencies).toBeDefined();
  });

  it('/api/v1/health/live (GET)', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/api/v1/health/live',
    });

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.payload);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('up');
  });
});
