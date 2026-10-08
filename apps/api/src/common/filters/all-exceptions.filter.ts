import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { toErrorBody } from './error-body';

type RequestWithId = Request & { id?: string | number };

/**
 * Converts every exception into the API error envelope and logs 5xx with stack traces.
 * `requestId` comes from pino-http (req.id), which also echoes it as the x-request-id header.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();

    const requestId = resolveRequestId(request);
    const body = toErrorBody(exception, requestId);

    if (body.statusCode >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        `${request.method} ${request.url} -> ${body.statusCode} ${body.code} (requestId=${requestId})`,
        stack,
      );
    } else if (body.statusCode !== 404) {
      this.logger.warn(
        `${request.method} ${request.url} -> ${body.statusCode} ${body.code} (requestId=${requestId})`,
      );
    }

    if (!response.getHeader('x-request-id')) response.setHeader('x-request-id', requestId);
    response.status(body.statusCode).json(body);
  }
}

function resolveRequestId(request: RequestWithId): string {
  if (request.id !== undefined && request.id !== null) return String(request.id);
  const header = request.headers['x-request-id'];
  if (typeof header === 'string' && header.length > 0) return header;
  return randomUUID();
}
