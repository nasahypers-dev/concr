import { fireEvent, render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { TourCallout } from './tour-callout';

beforeAll(() => {
  initI18n('az');
});

describe('TourCallout', () => {
  it('shows the step text with an arrow and forwards the buttons', async () => {
    const onSkip = jest.fn();
    const onNext = jest.fn();
    await render(
      <TourCallout
        title="Sifariş verin"
        body="Buradan başlayın"
        arrow="up"
        step={1}
        total={3}
        last={false}
        onSkip={onSkip}
        onNext={onNext}
      />,
    );
    expect(screen.getByText('Sifariş verin')).toBeTruthy();
    expect(screen.getByText('1/3')).toBeTruthy();
    expect(screen.getByTestId('tour-arrow-up')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Növbəti' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByRole('button', { name: 'Keç' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('labels the last step "Başla" and points down at a tab', async () => {
    await render(
      <TourCallout
        title="Obyektlər"
        body="Tökmə yerləri"
        arrow="down"
        arrowX={120}
        step={3}
        total={3}
        last
        onSkip={jest.fn()}
        onNext={jest.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Başla' })).toBeTruthy();
    expect(screen.getByTestId('tour-arrow-down')).toBeTruthy();
  });
});
