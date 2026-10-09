import { formatCardNumber, formatCvv, formatExpiry } from './card-format';

describe('card-format', () => {
  it('groups the card number in fours and caps it at 19 digits', () => {
    expect(formatCardNumber('4111111111111111')).toBe('4111 1111 1111 1111');
    expect(formatCardNumber('4111 1111 1')).toBe('4111 1111 1');
    expect(formatCardNumber('12345678901234567890123')).toBe('1234 5678 9012 3456 789');
    expect(formatCardNumber('abc')).toBe('');
  });

  it('formats the expiry as MM/YY', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('122')).toBe('12/2');
    expect(formatExpiry('12/27')).toBe('12/27');
    expect(formatExpiry('122799')).toBe('12/27');
  });

  it('keeps the CVV numeric and short', () => {
    expect(formatCvv('12a3')).toBe('123');
    expect(formatCvv('12345')).toBe('1234');
  });
});
