import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const result = data as Record<string, unknown> | null;

        return {
          statusCode,
          data: result?.data ?? data,
          message: result?.message ?? 'Success',
          ...(result?.meta ? { meta: result.meta } : {}),
        };
      }),
    );
  }
}
