import { HttpException } from '@nestjs/common';
import { ERROR_CODE_STATUS, type ErrorCode } from '@concr/shared';

export interface AppExceptionOptions {
  /** Overrides the default HTTP status of the code (see ERROR_CODE_STATUS). */
  status?: number;
  /** Developer-facing message; clients translate `code` via i18n `errors.<code>`. */
  message?: string;
  /** Structured, client-safe details (never secrets or stack traces). */
  details?: unknown;
}

/**
 * The only way to throw a domain error (CLAUDE.md rule 12). Extends HttpException so Nest
 * handles it even where AllExceptionsFilter is not registered.
 */
export class AppException extends HttpException {
  readonly code: ErrorCode;
  readonly details: unknown;

  constructor(code: ErrorCode, options: AppExceptionOptions = {}) {
    const status = options.status ?? ERROR_CODE_STATUS[code];
    const message = options.message ?? code;
    super({ code, message, details: options.details }, status);
    this.code = code;
    this.details = options.details;
  }
}
