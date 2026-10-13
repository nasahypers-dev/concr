import { fireEvent, render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { Banner } from './banner';

beforeAll(() => {
  initI18n('az');
});

describe('Banner', () => {
  it('shows the message and closes through the × when asked', async () => {
    const onClose = jest.fn();
    await render(<Banner tone="danger" message="Yanlış kod" onClose={onClose} />);
    expect(screen.getByText('Yanlış kod')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Bağla' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no close button by default', async () => {
    await render(<Banner message="Məlumat" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
