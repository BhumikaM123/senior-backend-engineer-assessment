export type TransactionStatus =
  | 'PENDING_SUBMISSION'
  | 'SUBMISSION_UNKNOWN'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED';

export interface CreateTransferCommand {
  tenantId: string;
  investorId: string;
  idempotencyKey: string;
  amount: string;
  assetId: string;
  sourceVaultAccountId: string;
  destinationAddress: string;
}

export interface TransactionRecord {
  id: string;
  tenantId: string;
  investorId: string;
  idempotencyKey: string;
  externalReference: string;
  fireblocksTransactionId?: string;
  status: TransactionStatus;
  amount: string;
  assetId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionStore {
  createOrGetByIdempotencyKey(command: CreateTransferCommand): Promise<TransactionRecord>;
  updateStatus(
    id: string,
    status: TransactionStatus,
    fireblocksTransactionId?: string,
  ): Promise<void>;
  findByExternalReference(reference: string): Promise<TransactionRecord | null>;
  findUnresolved(limit: number): Promise<TransactionRecord[]>;
}

export interface FireblocksClient {
  submitTransfer(input: {
    externalTxId: string;
    amount: string;
    assetId: string;
    sourceVaultAccountId: string;
    destinationAddress: string;
  }): Promise<{ id: string }>;
  getTransaction(providerId: string): Promise<{ status: string; id: string }>;
}
