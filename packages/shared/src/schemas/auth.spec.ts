import { otpRequestSchema, otpVerifySchema, staffLoginSchema } from './auth';
import { moneyStringSchema, paginationQuerySchema, phoneE164Schema } from './common';

describe('phoneE164Schema', () => {
  it('accepts Azerbaijani E.164 numbers', () => {
    expect(phoneE164Schema.parse('+994506209584')).toBe('+994506209584');
  });

  it('trims whitespace', () => {
    expect(phoneE164Schema.parse('  +994506209584 ')).toBe('+994506209584');
  });

  it.each(['0506209584', '+994 50 620 95 84', '994506209584', '+0123456789', ''])(
    'rejects %p',
    (value) => {
      expect(phoneE164Schema.safeParse(value).success).toBe(false);
    },
  );
});

describe('moneyStringSchema', () => {
  it.each(['110.00', '0.00', '1298.50'])('accepts %p', (value) => {
    expect(moneyStringSchema.safeParse(value).success).toBe(true);
  });

  it.each(['110', '110.0', '110,00', '-5.00', 'abc'])('rejects %p', (value) => {
    expect(moneyStringSchema.safeParse(value).success).toBe(false);
  });
});

describe('paginationQuerySchema', () => {
  it('applies defaults', () => {
    expect(paginationQuerySchema.parse({})).toEqual({ page: 1, limit: 20 });
  });

  it('coerces strings from query params and caps limit at 100', () => {
    expect(paginationQuerySchema.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
    expect(paginationQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });
});

describe('auth schemas', () => {
  it('otpRequestSchema requires a valid phone', () => {
    expect(otpRequestSchema.safeParse({ phone: '+994501234567' }).success).toBe(true);
    expect(otpRequestSchema.safeParse({ phone: '050' }).success).toBe(false);
  });

  it('otpVerifySchema requires a 6-digit code', () => {
    expect(otpVerifySchema.safeParse({ phone: '+994501234567', code: '123456' }).success).toBe(
      true,
    );
    expect(otpVerifySchema.safeParse({ phone: '+994501234567', code: '12345' }).success).toBe(
      false,
    );
    expect(otpVerifySchema.safeParse({ phone: '+994501234567', code: '12345a' }).success).toBe(
      false,
    );
  });

  it('staffLoginSchema validates email and password length', () => {
    expect(
      staffLoginSchema.safeParse({ email: 'dispatcher@example.com', password: 'Dispatcher123!' })
        .success,
    ).toBe(true);
    const bad = staffLoginSchema.safeParse({ email: 'nope', password: 'short' });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const paths = bad.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toEqual(expect.arrayContaining(['email', 'password']));
    }
  });
});
