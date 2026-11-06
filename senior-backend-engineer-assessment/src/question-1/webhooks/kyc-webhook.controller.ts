import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { KycWebhookDto } from './kyc-webhook.dto';
import { KycInboxStore, WebhookSignatureVerifier } from './kyc-webhook.interfaces';

@Controller('webhooks/kyc')
export class KycWebhookController {
  constructor(
    private readonly signatureVerifier: WebhookSignatureVerifier,
    private readonly inbox: KycInboxStore,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receive(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('x-provider-signature') signature?: string,
  ): Promise<{ accepted: true; duplicate: boolean }> {
    const rawBody = request.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw request body is required for signature verification');
    }
    if (!this.signatureVerifier.verify(rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    let payload: KycWebhookDto;
    try {
      payload = JSON.parse(rawBody.toString('utf8')) as KycWebhookDto;
    } catch {
      throw new BadRequestException('Invalid webhook JSON');
    }

    // In a real app, validate this DTO with ValidationPipe before accepting it.
    if (
      !payload.event_id ||
      !payload.investor_id ||
      !['approved', 'rejected', 'pending'].includes(payload.new_status) ||
      Number.isNaN(Date.parse(payload.timestamp))
    ) {
      throw new BadRequestException('Invalid KYC webhook payload');
    }

    const inserted = await this.inbox.insertIfAbsent({
      eventId: payload.event_id,
      payload,
      receivedAt: new Date(),
    });

    // 202 is returned only after durable acceptance. A worker processes the inbox later.
    return { accepted: true, duplicate: !inserted };
  }
}
