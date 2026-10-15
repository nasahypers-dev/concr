import {
  formatAzLocal,
  formatAzPhoneInput,
  isCompleteAzLocal,
  isPhoneLike,
  localDigits,
  stripAzPrefix,
  toAzE164,
} from './phone';

describe('phone helpers', () => {
  it('extracts the local digits from E.164', () => {
    expect(localDigits('+994503260343')).toBe('503260343');
    expect(localDigits('')).toBe('');
    expect(localDigits('503260343')).toBe('503260343');
  });

  it('strips a pasted or autofilled prefix but keeps a typed 99… number', () => {
    expect(stripAzPrefix('+994 50 326 03 43')).toBe('503260343');
    expect(stripAzPrefix('994503260343')).toBe('503260343');
    expect(stripAzPrefix('0503260343')).toBe('503260343');
    expect(stripAzPrefix('99 412 34 56')).toBe('994123456');
    expect(stripAzPrefix('50')).toBe('50');
    expect(stripAzPrefix('5032603431234')).toBe('503260343');
  });

  it('groups the local part as 2-3-2-2', () => {
    expect(formatAzLocal('503260343')).toBe('50 326 03 43');
    expect(formatAzLocal('5032')).toBe('50 32');
    expect(formatAzLocal('')).toBe('');
  });

  it('builds E.164 only from a complete local number', () => {
    expect(isCompleteAzLocal('503260343')).toBe(true);
    expect(isCompleteAzLocal('50326034')).toBe(false);
    expect(toAzE164('503260343')).toBe('+994503260343');
    expect(toAzE164('')).toBe('');
  });
  it('groups a free-form phone as it is typed and leaves e-mails alone', () => {
    expect(formatAzPhoneInput('0500000012')).toBe('050 000 00 12');
    expect(formatAzPhoneInput('05000')).toBe('050 00');
    expect(formatAzPhoneInput('500000012')).toBe('50 000 00 12');
    expect(formatAzPhoneInput('994500000012')).toBe('+994 50 000 00 12');
    expect(formatAzPhoneInput('050000001299')).toBe('050 000 00 12');
    expect(isPhoneLike('050 000 00 12')).toBe(true);
    expect(isPhoneLike('+994 50')).toBe(true);
    expect(isPhoneLike('rauf@example.az')).toBe(false);
    expect(isPhoneLike('')).toBe(false);
  });
});
