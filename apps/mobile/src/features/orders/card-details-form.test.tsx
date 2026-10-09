import { fireEvent, render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { CardDetailsForm } from './card-details-form';

beforeAll(() => {
  initI18n('az');
});

describe('CardDetailsForm', () => {
  it('masks the number and expiry as the user types and shows the demo note', async () => {
    await render(<CardDetailsForm />);
    expect(screen.getByText(/Demo rejimi/)).toBeTruthy();
    const number = screen.getByLabelText('Kart nömrəsi');
    await fireEvent.changeText(number, '4111111111111111');
    expect(number.props.value).toBe('4111 1111 1111 1111');
    const expiry = screen.getByLabelText('Son istifadə tarixi');
    await fireEvent.changeText(expiry, '1227');
    expect(expiry.props.value).toBe('12/27');
    expect(screen.getByLabelText('CVV').props.secureTextEntry).toBe(true);
  });
});
