import { FastifyRequest } from 'fastify';
import { AuthenticatedUser } from './token-payload';

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthenticatedUser;
}
