import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ErrorCode } from '@concr/shared';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { AppException } from '../errors/app.exception';
import { toErrorBody } from './error-body';

const requestId = 'req-123';

describe('toErrorBody', () => {
  it('maps AppException with its code, default status and details', () => {
    const body = toErrorBody(
      new AppException(ErrorCode.MIN_VOLUME_NOT_MET, { details: { minOrderM3: 3 } }),
      requestId,
    );
    expect(body).toEqual({
      statusCode: 422,
      code: 'MIN_VOLUME_NOT_MET',
      message: 'MIN_VOLUME_NOT_MET',
      details: { minOrderM3: 3 },
      requestId,
    });
  });

  it('lets AppException override status and message', () => {
    const body = toErrorBody(
      new AppException(ErrorCode.NOT_FOUND, { status: 410, message: 'Order is gone' }),
      requestId,
    );
    expect(body.statusCode).toBe(410);
    expect(body.message).toBe('Order is gone');
    expect(body).not.toHaveProperty('details');
  });

  it('maps ZodValidationException to VALIDATION_ERROR with flattened issues', () => {
    const result = z.object({ phone: z.string().min(5), volume: z.number() }).safeParse({
      phone: '1',
      volume: 'x',
    });
    if (result.success) throw new Error('expected failure');
    const body = toErrorBody(new ZodValidationException(result.error), requestId);
    expect(body.statusCode).toBe(400);
    expect(body.code).toBe('VALIDATION_ERROR');
    const details = body.details as { issues: { path: string }[] };
    expect(details.issues.map((issue) => issue.path).sort()).toEqual(['phone', 'volume']);
  });

  it('maps plain HttpException by status', () => {
    const body = toErrorBody(new NotFoundException('Cannot GET /x'), requestId);
    expect(body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /x',
      requestId,
    });
  });

  it('keeps structured HttpException payloads (e.g. Terminus) as details', () => {
    const body = toErrorBody(
      new ServiceUnavailableException({
        status: 'error',
        info: {},
        error: { redis: { status: 'down' } },
        details: { redis: { status: 'down' } },
      }),
      requestId,
    );
    expect(body.statusCode).toBe(503);
    expect(body.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.details).toEqual({
      status: 'error',
      info: {},
      details: { redis: { status: 'down' } },
    });
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    const body = toErrorBody(new Error('secret db password leaked'), requestId);
    expect(body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      requestId,
    });
  });

  it('handles non-Error throwables', () => {
    expect(toErrorBody('boom', requestId).code).toBe('INTERNAL_ERROR');
    expect(toErrorBody(undefined, requestId).statusCode).toBe(500);
  });
});
