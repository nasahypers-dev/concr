import { maskPhone } from './mask-phone';

describe('maskPhone', () => {
  it('keeps country code, operator prefix and last two digits', () => {
    expect(maskPhone('+994506209584')).toBe('+99450*****84');
  });

  it('masks short or empty values entirely', () => {
    expect(maskPhone('')).toBe('***');
    expect(maskPhone(null)).toBe('***');
    expect(maskPhone(undefined)).toBe('***');
    expect(maskPhone('+99450')).toBe('***');
  });

  it('never reveals more than 8 characters', () => {
    const masked = maskPhone('+1234567890123');
    expect(masked.replace(/\*/g, '')).toHaveLength(8);
  });
});
