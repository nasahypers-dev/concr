import {
  addMoney,
  compareMoney,
  formatAzn,
  fromQepik,
  isMoneyString,
  isZeroMoney,
  multiplyMoney,
  subtractMoney,
  toQepik,
} from './money';

describe('money', () => {
  it('converts between strings and qəpik', () => {
    expect(toQepik('110.00')).toBe(11000);
    expect(toQepik('0.05')).toBe(5);
    expect(toQepik('-12.34')).toBe(-1234);
    expect(fromQepik(11000)).toBe('110.00');
    expect(fromQepik(5)).toBe('0.05');
    expect(fromQepik(-1234)).toBe('-12.34');
    expect(fromQepik(0)).toBe('0.00');
  });

  it('rejects malformed money strings', () => {
    expect(isMoneyString('110')).toBe(false);
    expect(isMoneyString('110.0')).toBe(false);
    expect(isMoneyString('110,00')).toBe(false);
    expect(isMoneyString(110)).toBe(false);
    expect(() => toQepik('abc')).toThrow(TypeError);
  });

  it('adds, subtracts and compares without floating point drift', () => {
    expect(addMoney('0.10', '0.20')).toBe('0.30');
    expect(addMoney('1100.00', '0.00', '198.00')).toBe('1298.00');
    expect(subtractMoney('10.00', '12.50')).toBe('-2.50');
    expect(compareMoney('1.00', '1.00')).toBe(0);
    expect(compareMoney('0.99', '1.00')).toBe(-1);
    expect(compareMoney('1.01', '1.00')).toBe(1);
    expect(isZeroMoney('0.00')).toBe(true);
    expect(isZeroMoney('0.01')).toBe(false);
  });

  it('multiplies by volume and VAT rate with half-up rounding', () => {
    expect(multiplyMoney('110.00', 10)).toBe('1100.00');
    expect(multiplyMoney('110.00', 7.5)).toBe('825.00');
    expect(multiplyMoney('1100.00', 0.18)).toBe('198.00');
    expect(multiplyMoney('0.01', 0.5)).toBe('0.01'); // 0.5 qəpik rounds up
    expect(multiplyMoney('0.01', 0.49)).toBe('0.00');
    expect(() => multiplyMoney('1.00', Number.NaN)).toThrow(TypeError);
  });

  it('formats as Azerbaijani currency text', () => {
    expect(formatAzn('1298.00')).toBe('1 298,00 ₼');
    expect(formatAzn('110.00')).toBe('110,00 ₼');
    expect(formatAzn('1234567.89')).toBe('1 234 567,89 ₼');
    expect(formatAzn('-5.50')).toBe('-5,50 ₼');
    expect(formatAzn('1298.00', { symbol: false })).toBe('1 298,00');
    expect(formatAzn('1298.00', { thousandsSeparator: ' ', symbol: false })).toBe('1 298,00');
  });
});
