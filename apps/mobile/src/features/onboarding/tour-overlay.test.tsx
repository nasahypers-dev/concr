import { fireEvent, render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { TourOverlay, type TourStep } from './tour-overlay';

beforeAll(() => {
  initI18n('az');
});

const steps: TourStep[] = [
  { key: 'order', title: 'Sifariş verin', body: 'Buradan başlayın', target: null, arrow: 'up' },
  {
    key: 'orders',
    title: 'Sifarişləriniz',
    body: 'Burada izləyin',
    target: { x: 100, y: 700, width: 100, height: 60 },
    arrow: 'down',
  },
];

describe('TourOverlay', () => {
  it('walks through the steps and finishes on the last one', async () => {
    const onDone = jest.fn();
    await render(<TourOverlay visible steps={steps} onDone={onDone} />);
    expect(screen.getByText('Sifariş verin')).toBeTruthy();
    expect(screen.queryByTestId('tour-target-frame')).toBeNull(); // not measured yet: no cut-out
    await fireEvent.press(screen.getByRole('button', { name: 'Növbəti' }));
    expect(screen.getByText('Sifarişləriniz')).toBeTruthy();
    expect(screen.getByTestId('tour-target-frame')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Başla' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('can be skipped at any step', async () => {
    const onDone = jest.fn();
    await render(<TourOverlay visible steps={steps} onDone={onDone} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Keç' }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when hidden', async () => {
    await render(<TourOverlay visible={false} steps={steps} onDone={jest.fn()} />);
    expect(screen.queryByTestId('tour-overlay')).toBeNull();
  });
});
