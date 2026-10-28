import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, unknown> = {
          MINIO_ENDPOINT: 'localhost',
          MINIO_PORT: 9000,
          MINIO_USE_SSL: false,
          MINIO_ACCESS_KEY: 'test-access-key',
          MINIO_SECRET_KEY: 'test-secret-key',
          MINIO_BUCKET: 'test-bucket',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct bucket name', () => {
    expect(service.getBucketName()).toBe('test-bucket');
  });

  it('should report unconfigured if credentials are not provided', async () => {
    const unconfiguredConfig: Partial<ConfigService> = {
      get: jest.fn(() => undefined),
    };

    const unconfiguredModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: unconfiguredConfig,
        },
      ],
    }).compile();

    const unconfiguredService = unconfiguredModule.get<StorageService>(StorageService);
    const health = await unconfiguredService.checkStorageHealth();
    expect(health).toBe('unconfigured');
  });
});
