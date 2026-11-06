import { Injectable, Logger } from '@nestjs/common';
import {
  InvestorKycRepository,
  KycInboxStore,
} from './kyc-webhook.interfaces';

@Injectable()
export class KycWebhookProcessor {
  private readonly logger = new Logger(KycWebhookProcessor.name);

  constructor(
    private readonly inbox: KycInboxStore,
    private readonly investors: InvestorKycRepository,
  ) {}

  async processBatch(batchSize = 50): Promise<void> {
    const events = await this.inbox.getUnprocessed(batchSize);

    for (const event of events) {
      try {
        // Make this update idempotent. Ideally update investor + inbox status
        // in one DB transaction, or use a transactional outbox/inbox pattern.
        await this.investors.updateKycStatus(
          event.payload.investor_id,
          event.payload.new_status,
        );
        await this.inbox.markProcessed(event.eventId, new Date());
      } catch (error) {
        this.logger.error(`KYC event processing failed: ${event.eventId}`, error);
        // Leave unprocessed for retry; use retry count/dead-letter handling in production.
      }
    }
  }
}
