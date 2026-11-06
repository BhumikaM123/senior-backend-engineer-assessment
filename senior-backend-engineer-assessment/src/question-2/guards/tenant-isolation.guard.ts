import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AuthenticatedUser, TenantContext } from '../interfaces/authenticated-user.interface';

interface TenantRequest {
  user?: AuthenticatedUser;
  tenantContext?: TenantContext;
}

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user; // Must be populated by JwtAuthGuard first.

    if (!user?.sub || !user.tenant_id) {
      throw new ForbiddenException('Authenticated tenant context is required');
    }

    request.tenantContext = {
      tenantId: user.tenant_id,
      userId: user.sub,
      investorId: user.investor_id,
      roles: user.roles ?? [],
    };
    return true;
  }
}
