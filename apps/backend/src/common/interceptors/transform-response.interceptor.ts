import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccessResponse } from '@tampilkit-ac/api-contract';
import { FastifyRequest } from 'fastify';

@Injectable()
export class TransformResponseInterceptor<T>
  implements NestInterceptor<T, ApiSuccessResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiSuccessResponse<T>> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const correlationId = (req.headers['x-correlation-id'] as string) || req.id;

    return next.handle().pipe(
      map((data) => {
        // If data is already in ApiSuccessResponse format, return as is with correlationId
        if (data && typeof data === 'object' && 'success' in data && data.success === true) {
          return {
            ...data,
            correlationId,
          };
        }

        return {
          success: true,
          data,
          correlationId,
        };
      }),
    );
  }
}
