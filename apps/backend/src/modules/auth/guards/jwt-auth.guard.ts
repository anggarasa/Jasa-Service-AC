import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_COOKIE_NAME, IS_PUBLIC_KEY } from '../auth.constants';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';
import { AuthenticatedRequest } from '../types/authenticated-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Sesi autentikasi tidak ditemukan. Silakan masuk terlebih dahulu.',
      );
    }

    // 1. Verify token signature and claims
    const payload = await this.tokenService.verifyAccessToken(token);

    // 2. Authoritatively validate session & account state in PostgreSQL
    const { user } = await this.sessionService.validateSession({
      sessionId: payload.sid,
      userId: payload.sub,
      tokenVersion: payload.tv,
    });

    // 3. Attach authenticated user context to request
    request.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      sessionId: payload.sid,
      tokenVersion: user.tokenVersion,
    };

    return true;
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    // 1. Check HttpOnly cookie first
    if (request.cookies && request.cookies[ACCESS_COOKIE_NAME]) {
      return request.cookies[ACCESS_COOKIE_NAME];
    }

    // 2. Check Authorization header as fallback
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
