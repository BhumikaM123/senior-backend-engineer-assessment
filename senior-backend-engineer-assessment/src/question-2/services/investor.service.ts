import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantContext } from '../interfaces/authenticated-user.interface';

export interface InvestorRepository {
  findOne(filter: { id: string; tenantId: string }): Promise<unknown | null>;
  updateOne(
    filter: { id: string; tenantId: string },
    changes: Record<string, unknown>,
  ): Promise<boolean>;
}

@Injectable()
export class InvestorService {
  constructor(private readonly investors: InvestorRepository) {}

  async getInvestor(id: string, context: TenantContext): Promise<unknown> {
    const investor = await this.investors.findOne({
      id,
      tenantId: context.tenantId,
    });
    // Same response for missing and foreign-tenant resources avoids disclosure.
    if (!investor) throw new NotFoundException('Investor not found');
    return investor;
  }

  async updateInvestor(
    id: string,
    allowedChanges: Record<string, unknown>,
    context: TenantContext,
  ): Promise<void> {
    // Never accept tenantId/tenant_id from the request body.
    const safeChanges = { ...allowedChanges };
    delete safeChanges.tenantId;
    delete safeChanges.tenant_id;

    const updated = await this.investors.updateOne(
      { id, tenantId: context.tenantId },
      safeChanges,
    );
    if (!updated) throw new NotFoundException('Investor not found');
  }
}
