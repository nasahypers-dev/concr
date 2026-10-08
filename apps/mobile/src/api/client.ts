import { type ApiErrorBody, ErrorCode, isApiErrorBody } from '@concr/shared';

/** Inlined by Expo at bundle time; must be the LAN address of the laptop, see .env.example. */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

/** The API answered with the error envelope; `code` maps to i18n `errors.<code>`. */
export class ApiError extends Error {
  readonly body: ApiErrorBody;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.body = body;
  }

  get code(): ErrorCode {
    return this.body.code;
  }

  get statusCode(): number {
    return this.body.statusCode;
  }
}

/** fetch() itself failed: no network, DNS, wrong LAN IP, API not running. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : 'Network request failed');
    this.name = 'NetworkError';
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  headers?: Record<string, string>;
  accessToken?: string | null;
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers = {}, accessToken, ...rest } = options;
  const requestHeaders: Record<string, string> = { Accept: 'application/json', ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  if (accessToken) requestHeaders.Authorization = `Bearer ${accessToken}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    throw new NetworkError(error);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text.length > 0) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (isApiErrorBody(data)) throw new ApiError(data);
    throw new ApiError({
      statusCode: response.status,
      code: response.status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST,
      message: response.statusText || `HTTP ${response.status}`,
      requestId: response.headers.get('x-request-id') ?? '',
    });
  }

  return data as T;
}
