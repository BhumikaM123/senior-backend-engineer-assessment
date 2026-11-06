import { KycWebhookDto } from './kyc-webhook.dto';

export interface KycInboxEvent {
  eventId: string;
  payload: KycWebhookDto;
  receivedAt: Date;
  processedAt?: Date;
}

export interface KycInboxStore {
  /** Must be backed by a durable store with a unique constraint on eventId. */
  insertIfAbsent(event: KycInboxEvent): Promise<boolean>;
  getUnprocessed(limit: number): Promise<KycInboxEvent[]>;
  markProcessed(eventId: string, processedAt: Date): Promise<void>;
}

export interface InvestorKycRepository {
  /** Must update only the investor belonging to the expected tenant/context. */
  updateKycStatus(investorId: string, status: KycWebhookDto['new_status']): Promise<void>;
}

export interface WebhookSignatureVerifier {
  verify(rawBody: Buffer, signature: string | undefined): boolean;
}
