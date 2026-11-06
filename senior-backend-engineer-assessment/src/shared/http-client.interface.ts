export interface HttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string | undefined>;
}

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface HttpClient {
  get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T>(
    url: string,
    body: unknown,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse<T>>;
}

export class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers: Record<string, string | undefined> = {},
  ) {
    super(message);
    this.name = 'HttpStatusError';
  }
}
