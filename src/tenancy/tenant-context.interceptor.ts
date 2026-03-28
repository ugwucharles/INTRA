import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from './tenant-context';
import type { JwtPayload } from '../auth/jwt.strategy';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = (req?.user ?? undefined) as JwtPayload | undefined;

    // Run the rest of the request inside an AsyncLocalStorage context so Prisma
    // can automatically scope queries by orgId.
    return TenantContext.run(
      {
        orgId: user?.orgId,
        userId: user?.userId,
        role: user?.role,
      },
      () => next.handle(),
    );
  }
}

