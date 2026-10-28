import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessClosuresController } from './business-closures.controller';
import { BusinessClosuresService } from './business-closures.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BusinessClosuresController],
  providers: [BusinessClosuresService],
  exports: [BusinessClosuresService],
})
export class BusinessClosuresModule {}
