import { Injectable, Logger } from '@nestjs/common';
import {
  FireblocksClient,
  TransactionStore,
  TransactionStatus,
} from '../transactions/transaction.interfaces';

const STATUS_MAP: Record<string, TransactionStatus | undefined> = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  SUBMITTED: 'SUBMITTED',
  PENDING: 'SUBMITTED',
};

@Injectable()
export class TransactionReconciliationService {
  private readonly logger = new Logger(TransactionReconciliationService.name);

  constructor(
    private readonly store: TransactionStore,
    private readonly fireblocks: FireblocksClient,
  ) {}

  async reconcileBatch(limit = 100): Promise<void> {
    const records = await this.store.findUnresolved(limit);

    for (const record of records) {
      if (!record.fireblocksTransactionId) {
        // A production adapter should query by externalReference when submission
        // outcome is unknown, using the provider's supported lookup API.
        this.logger.warn(`Needs provider lookup by external reference: ${record.id}`);
        continue;
      }

      try {
        const providerState = await this.fireblocks.getTransaction(
          record.fireblocksTransactionId,
        );
        const status = STATUS_MAP[providerState.status.toUpperCase()];
        if (status) {
          await this.store.updateStatus(record.id, status, providerState.id);
        }
      } catch (error) {
        this.logger.error(`Reconciliation failed for ${record.id}`, error);
      }
    }
  }
}
