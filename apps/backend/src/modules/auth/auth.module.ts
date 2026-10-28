import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { RefreshRotationService } from './services/refresh-rotation.service';
import { RateLimitService } from './services/rate-limit.service';
import { AuthAuditService } from './services/auth-audit.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    RefreshRotationService,
    RateLimitService,
    AuthAuditService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    PasswordService,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
