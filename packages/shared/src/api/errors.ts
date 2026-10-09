import type { ApiErrorBody } from '../api-error';
import { ERROR_CODE_STATUS, type ErrorCode } from '../error-codes';

export interface ApiClientErrorOptions {
  statusCode?: number;
  message?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Error thrown by every ApiClient implementation (mock and HTTP alike). `code` is what the UI
 * translates (`errors.<code>`); `details` carries structured hints such as `{ minOrderM3 }`.
 */
export class ApiClientError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: unknown;
  readonly requestId: string;

  constructor(code: ErrorCode, options: ApiClientErrorOptions = {}) {
    super(options.message ?? code);
    this.name = 'ApiClientError';
    this.code = code;
    this.statusCode = options.statusCode ?? ERROR_CODE_STATUS[code];
    this.details = options.details;
    this.requestId = options.requestId ?? '';
  }

  static fromBody(body: ApiErrorBody): ApiClientError {
    return new ApiClientError(body.code, {
      statusCode: body.statusCode,
      message: body.message,
      details: body.details,
      requestId: body.requestId,
    });
  }

  toBody(): ApiErrorBody {
    const body: ApiErrorBody = {
      statusCode: this.statusCode,
      code: this.code,
      message: this.message,
      requestId: this.requestId,
    };
    if (this.details !== undefined) body.details = this.details;
    return body;
  }
}

/** The request never reached the API: offline, wrong LAN IP, API down. */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super(cause instanceof Error ? cause.message : 'Network request failed');
    this.name = 'NetworkError';
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
