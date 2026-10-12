import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';
import { PhoneField } from './phone-field';

function Harness({ onChange }: { onChange: (digits: string) => void }) {
  const [digits, setDigits] = useState('');
  return (
    <PhoneField
      label="Telefon"
      value={digits}
      onChangeText={(next) => {
        setDigits(next);
        onChange(next);
      }}
    />
  );
}

describe('PhoneField', () => {
  it('shows the fixed prefix and groups the typed local digits', async () => {
    const onChange = jest.fn();
    await render(<Harness onChange={onChange} />);
    expect(screen.getByText('+994')).toBeTruthy();
    const input = screen.getByLabelText('Telefon');
    await fireEvent.changeText(input, '503260343');
    expect(onChange).toHaveBeenLastCalledWith('503260343');
    expect(input.props.value).toBe('50 326 03 43');
  });

  it('reduces an autofilled full number to its local part', async () => {
    const onChange = jest.fn();
    await render(<Harness onChange={onChange} />);
    await fireEvent.changeText(screen.getByLabelText('Telefon'), '+994 50 326 03 43');
    expect(onChange).toHaveBeenLastCalledWith('503260343');
  });

  it('renders the error line', async () => {
    await render(<PhoneField label="Telefon" value="" onChangeText={jest.fn()} error="Səhv" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
