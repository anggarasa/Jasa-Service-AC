import { UserRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  role: UserRole;
  tv: number; // tokenVersion
  type: 'access';
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface RefreshTokenPayload {
  sub: string; // userId
  sid: string; // sessionId
  type: 'refresh';
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  sessionId: string;
  tokenVersion: number;
}
