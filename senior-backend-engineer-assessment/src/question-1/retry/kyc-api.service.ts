import { Injectable } from '@nestjs/common';
import { HttpClient } from '../../shared/http-client.interface';
import { KycTokenService } from '../auth/kyc-token.service';
import { KycRetryService } from './kyc-retry.service';

@Injectable()
export class KycApiService {
  constructor(
    private readonly http: HttpClient,
    private readonly tokens: KycTokenService,
    private readonly retry: KycRetryService,
    private readonly baseUrl: string,
  ) {}

  async getVerification(investorId: string): Promise<unknown> {
    return this.retry.execute(async () => {
      const token = await this.tokens.getAccessToken();
      const response = await this.http.get<unknown>(
        `${this.baseUrl}/investors/${encodeURIComponent(investorId)}/verification`,
        { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 8_000 },
      );
      return response.data;
    });
  }
}
