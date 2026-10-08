import { fireEvent, render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { StateView } from './state-view';

beforeAll(() => {
  initI18n('az');
});

describe('StateView', () => {
  it('shows the translated loading text', async () => {
    await render(<StateView status="loading" />);
    expect(screen.getByText('Yüklənir…')).toBeTruthy();
  });

  it('shows translated empty defaults', async () => {
    await render(<StateView status="empty" />);
    expect(screen.getByText('Hələ heç nə yoxdur')).toBeTruthy();
  });

  it('shows the error state with a retry button', async () => {
    const onRetry = jest.fn();
    await render(<StateView status="error" onRetry={onRetry} />);
    expect(screen.getByText('Xəta baş verdi')).toBeTruthy();
    await fireEvent.press(screen.getByText('Yenidən cəhd et'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
