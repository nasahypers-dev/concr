// Machine-readable error codes returned in the API error envelope
// `{ statusCode, code, message, details?, requestId }`.
// Every code has a user-facing translation under `errors.<CODE>` in i18n/*.json
// (enforced by src/i18n/i18n.spec.ts).

export const ErrorCode = {
  // generic
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  // domain
  MIN_VOLUME_NOT_MET: 'MIN_VOLUME_NOT_MET',
  OUT_OF_SERVICE_AREA: 'OUT_OF_SERVICE_AREA',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  // auth
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_TOO_MANY_ATTEMPTS: 'OTP_TOO_MANY_ATTEMPTS',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ERROR_CODES = Object.values(ErrorCode) as readonly ErrorCode[];

/** Default HTTP status for each code; the API may override per throw. */
export const ERROR_CODE_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  MIN_VOLUME_NOT_MET: 422,
  OUT_OF_SERVICE_AREA: 422,
  INVALID_STATE_TRANSITION: 409,
  OTP_INVALID: 400,
  OTP_EXPIRED: 400,
  OTP_TOO_MANY_ATTEMPTS: 429,
};

/** Reverse lookup used by the API filter for plain HttpExceptions without a code. */
export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.BAD_REQUEST;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 503:
      return ErrorCode.SERVICE_UNAVAILABLE;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
