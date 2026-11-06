import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { HttpClient } from '../../shared/http-client.interface';

interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

@Injectable()
export class KycTokenService {
  private cached?: CachedToken;
  private refreshInFlight?: Promise<string>;
  private readonly refreshSkewMs = 60_000;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenUrl: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  async getAccessToken(): Promise<string> {
    if (this.cached && Date.now() < this.cached.expiresAt - this.refreshSkewMs) {
      return this.cached.value;
    }

    // Coalesce concurrent refreshes so one process performs one token request.
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.fetchToken().finally(() => {
        this.refreshInFlight = undefined;
      });
    }

    try {
      return await this.refreshInFlight;
    } catch (error) {
      // Use an old token only if it has not actually expired.
      if (this.cached && Date.now() < this.cached.expiresAt) {
        return this.cached.value;
      }
      throw new ServiceUnavailableException('KYC provider authentication unavailable', {
        cause: error,
      });
    }
  }

  private async fetchToken(): Promise<string> {
    const response = await this.http.post<OAuthTokenResponse>(
      this.tokenUrl,
      {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      },
      { timeoutMs: 5_000 },
    );

    if (
      !response.data.access_token ||
      !Number.isFinite(response.data.expires_in) ||
      response.data.expires_in <= 0
    ) {
      throw new Error('KYC provider returned an invalid OAuth token response');
    }

    this.cached = {
      value: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1_000,
    };
    return this.cached.value;
  }
}
