import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { StorageService } from '../../infrastructure/storage/storage.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrismaService: Partial<PrismaService>;
  let mockStorageService: Partial<StorageService>;

  beforeEach(async () => {
    mockPrismaService = {
      checkDatabaseHealth: jest.fn().mockResolvedValue('connected'),
    };
    mockStorageService = {
      checkStorageHealth: jest.fn().mockResolvedValue('connected'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return operational status when all dependencies are connected', async () => {
    const health = await controller.getHealth();
    expect(health.application).toBe('tampilkit-ac-booking');
    expect(health.status).toBe('operational');
    expect(health.dependencies.database).toBe('connected');
    expect(health.dependencies.storage).toBe('connected');
  });

  it('should return liveness data correctly', () => {
    const liveness = controller.getLiveness();
    expect(liveness.status).toBe('up');
    expect(liveness.timestamp).toBeDefined();
  });
});
