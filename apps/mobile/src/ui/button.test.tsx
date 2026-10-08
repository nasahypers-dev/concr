import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from './button';

// RNTL 14: render() and fireEvent are async (React 19 concurrent rendering).
describe('Button', () => {
  it('renders its label and reacts to press', async () => {
    const onPress = jest.fn();
    await render(<Button label="Beton sifariş et" onPress={onPress} />);
    await fireEvent.press(screen.getByText('Beton sifariş et'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('ignores presses while loading and exposes the busy state', async () => {
    const onPress = jest.fn();
    await render(<Button label="Göndər" loading onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Göndər' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
    expect(button).toBeBusy();
    expect(screen.queryByText('Göndər')).toBeNull();
  });

  it('ignores presses when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Ləğv et" disabled onPress={onPress} />);
    await fireEvent.press(screen.getByText('Ləğv et'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
