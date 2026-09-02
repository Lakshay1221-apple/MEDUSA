import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((res) => {
        // If already structured with data/meta, return as is
        if (res && typeof res === 'object' && 'data' in res) {
          return res;
        }
        return {
          data: res !== undefined ? res : null,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}
