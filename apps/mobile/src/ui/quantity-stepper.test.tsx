import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { QuantityStepper } from './quantity-stepper';

function Harness({ initial = 10 }: { initial?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <QuantityStepper
      value={value}
      onChange={setValue}
      min={3}
      max={12}
      step={0.5}
      unit="m³"
      accessibilityLabel="volume"
    />
  );
}

describe('QuantityStepper', () => {
  it('increments and decrements by the step within bounds', async () => {
    await render(<Harness />);
    await fireEvent.press(screen.getByLabelText('+'));
    expect(screen.getByDisplayValue('10.5')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('−'));
    await fireEvent.press(screen.getByLabelText('−'));
    expect(screen.getByDisplayValue('9.5')).toBeTruthy();
  });

  it('disables the buttons at the bounds', async () => {
    await render(<Harness initial={12} />);
    expect(screen.getByLabelText('+')).toBeDisabled();
    await fireEvent.press(screen.getByLabelText('+'));
    expect(screen.getByDisplayValue('12')).toBeTruthy();
  });

  it('accepts typed values with a comma and clamps them', async () => {
    await render(<Harness />);
    const input = screen.getByDisplayValue('10');
    await fireEvent.changeText(input, '7,25');
    await fireEvent(input, 'blur');
    expect(screen.getByDisplayValue('7.25')).toBeTruthy();
    await fireEvent.changeText(input, '99');
    await fireEvent(input, 'blur');
    expect(screen.getByDisplayValue('12')).toBeTruthy();
    await fireEvent.changeText(input, 'abc');
    await fireEvent(input, 'blur');
    expect(screen.getByDisplayValue('12')).toBeTruthy();
  });
});
