import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, errorCodeForStatus, type ApiErrorBody } from '@concr/shared';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { AppException } from '../errors/app.exception';

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

/**
 * Pure mapping from any thrown value to the API error envelope
 * `{ statusCode, code, message, details?, requestId }` (CLAUDE.md rule 12).
 * Unknown errors never leak their message or stack to the client.
 */
export function toErrorBody(exception: unknown, requestId: string): ApiErrorBody {
  if (exception instanceof ZodValidationException) {
    const zodError: unknown = exception.getZodError();
    const issues: ValidationIssue[] =
      zodError instanceof ZodError
        ? zodError.issues.map((issue) => ({
            path: issue.path.map(String).join('.'),
            code: issue.code,
            message: issue.message,
          }))
        : [];
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: { issues },
      requestId,
    };
  }

  if (exception instanceof AppException) {
    const body: ApiErrorBody = {
      statusCode: exception.getStatus(),
      code: exception.code,
      message: exception.message,
      requestId,
    };
    if (exception.details !== undefined) body.details = exception.details;
    return body;
  }

  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const body: ApiErrorBody = {
      statusCode,
      code: errorCodeForStatus(statusCode),
      message: extractMessage(response, exception.message),
      requestId,
    };
    const details = extractDetails(response);
    if (details !== undefined) body.details = details;
    return body;
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
    requestId,
  };
}

function extractMessage(response: string | object, fallback: string): string {
  if (typeof response === 'string') return response;
  const message = (response as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join('; ');
  return fallback;
}

/** Everything a HttpException carried besides `message`/`statusCode`/`error`, e.g. Terminus results. */
function extractDetails(response: string | object): unknown {
  if (typeof response !== 'object') return undefined;
  const { message: _m, statusCode: _s, error: _e, ...rest } = response as Record<string, unknown>;
  return Object.keys(rest).length > 0 ? rest : undefined;
}
