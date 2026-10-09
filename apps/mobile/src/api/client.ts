import { ApiClientError, ErrorCode, isApiErrorBody, NetworkError } from '@concr/shared';

/**
 * HTTP transport for the future `HttpApiClient` (Phase B2). Not used while
 * EXPO_PUBLIC_API_MODE=mock. Inlined by Expo at bundle time; must be the LAN address of the
 * laptop when testing on a phone, see .env.example.
 */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

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
    if (isApiErrorBody(data)) throw ApiClientError.fromBody(data);
    throw new ApiClientError(
      response.status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST,
      {
        statusCode: response.status,
        message: response.statusText || `HTTP ${response.status}`,
        requestId: response.headers.get('x-request-id') ?? '',
      },
    );
  }

  return data as T;
}
