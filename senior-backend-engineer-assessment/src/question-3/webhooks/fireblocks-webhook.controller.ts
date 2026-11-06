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

export interface FireblocksWebhookVerifier {
  verify(rawBody: Buffer, signature?: string): boolean;
}
export interface FireblocksWebhookHandler {
  accept(event: unknown): Promise<void>; // Persist idempotently before returning.
}

@Controller('webhooks/fireblocks')
export class FireblocksWebhookController {
  constructor(
    private readonly verifier: FireblocksWebhookVerifier,
    private readonly handler: FireblocksWebhookHandler,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async receive(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('x-provider-signature') signature?: string,
  ) {
    if (!request.rawBody || !this.verifier.verify(request.rawBody, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    let event: unknown;
    try {
      event = JSON.parse(request.rawBody.toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid webhook JSON');
    }

    await this.handler.accept(event);
    return { accepted: true };
  }
}
