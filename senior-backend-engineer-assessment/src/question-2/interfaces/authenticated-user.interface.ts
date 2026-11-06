export interface AuthenticatedUser {
  sub: string;
  tenant_id: string;
  investor_id?: string;
  roles?: string[];
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  investorId?: string;
  roles: string[];
}
