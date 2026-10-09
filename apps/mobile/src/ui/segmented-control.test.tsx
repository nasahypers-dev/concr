import { fireEvent, render, screen } from '@testing-library/react-native';
import { SegmentedControl } from './segmented-control';

const options = [
  { value: 'P2', label: 'P2' },
  { value: 'P3', label: 'P3' },
  { value: 'P4', label: 'P4', disabled: true },
] as const;

describe('SegmentedControl', () => {
  it('reports selection changes and ignores the selected and disabled options', async () => {
    const onChange = jest.fn();
    await render(
      <SegmentedControl
        options={[...options]}
        value="P2"
        onChange={onChange}
        accessibilityLabel="slump"
      />,
    );
    await fireEvent.press(screen.getByText('P3'));
    expect(onChange).toHaveBeenCalledWith('P3');
    await fireEvent.press(screen.getByText('P2'));
    await fireEvent.press(screen.getByText('P4'));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('radio', { name: 'P2' })).toBeSelected();
  });

  it('clears the selection when the selected option is pressed and onDeselect is given', async () => {
    const onChange = jest.fn();
    const onDeselect = jest.fn();
    await render(
      <SegmentedControl
        options={[...options]}
        value="P2"
        onChange={onChange}
        onDeselect={onDeselect}
      />,
    );
    await fireEvent.press(screen.getByText('P2'));
    expect(onDeselect).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});
