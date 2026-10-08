import { validateEnv } from './env';

describe('validateEnv', () => {
  it('applies defaults for an empty environment', () => {
    const env = validateEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3001']);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('coerces PORT and splits CORS_ORIGINS', () => {
    const env = validateEnv({
      PORT: '4000',
      CORS_ORIGINS: 'http://a.test, http://b.test ,',
    });
    expect(env.PORT).toBe(4000);
    expect(env.CORS_ORIGINS).toEqual(['http://a.test', 'http://b.test']);
  });

  it('rejects invalid values with a readable message', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', PORT: 'abc' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
