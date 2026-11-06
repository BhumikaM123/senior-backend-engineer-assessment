import { Injectable } from '@nestjs/common';
import { HttpStatusError } from '../../shared/http-client.interface';

export class KycRateLimitRetriesExhaustedError extends Error {
  constructor() {
    super('KYC provider rate limit retries exhausted');
    this.name = 'KycRateLimitRetriesExhaustedError';
  }
}

@Injectable()
export class KycRetryService {
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 250;
  private readonly maxDelayMs = 5_000;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        if (!(error instanceof HttpStatusError) || error.status !== 429) {
          throw error;
        }
        if (attempt >= this.maxRetries) {
          throw new KycRateLimitRetriesExhaustedError();
        }

        const retryAfterMs = this.parseRetryAfter(error.headers['retry-after']);
        const exponential = Math.min(this.maxDelayMs, this.baseDelayMs * 2 ** attempt);
        const jittered = Math.floor(exponential * (0.5 + Math.random()));
        await this.sleep(retryAfterMs ?? jittered);
      }
    }
  }

  private parseRetryAfter(value?: string): number | undefined {
    if (!value) return undefined;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
    const dateMs = Date.parse(value);
    return Number.isNaN(dateMs) ? undefined : Math.max(0, dateMs - Date.now());
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
