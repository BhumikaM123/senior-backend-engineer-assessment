import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import {
  CreateTransferCommand,
  FireblocksClient,
  TransactionStore,
} from './transaction.interfaces';

@Injectable()
export class TransactionService {
  constructor(
    private readonly store: TransactionStore,
    private readonly fireblocks: FireblocksClient,
  ) {}

  async initiate(command: CreateTransferCommand) {
    const transaction = await this.store.createOrGetByIdempotencyKey(command);

    // If a previous attempt timed out after submission, reconcile first.
    if (
      transaction.status === 'SUBMITTED' ||
      transaction.status === 'COMPLETED' ||
      transaction.status === 'SUBMISSION_UNKNOWN'
    ) {
      return { transactionId: transaction.id, status: transaction.status };
    }

    try {
      const providerResult = await this.fireblocks.submitTransfer({
        externalTxId: transaction.externalReference,
        amount: transaction.amount,
        assetId: transaction.assetId,
        sourceVaultAccountId: command.sourceVaultAccountId,
        destinationAddress: command.destinationAddress,
      });
      await this.store.updateStatus(transaction.id, 'SUBMITTED', providerResult.id);
      return { transactionId: transaction.id, status: 'SUBMITTED' as const };
    } catch (error) {
      // A network timeout can happen after the provider accepted the transfer.
      // Mark ambiguous and reconcile; do not blindly submit a second transfer.
      await this.store.updateStatus(transaction.id, 'SUBMISSION_UNKNOWN');
      throw new ServiceUnavailableException(
        `Transfer submission outcome is unknown; check transaction ${transaction.id}`,
        { cause: error },
      );
    }
  }
}
