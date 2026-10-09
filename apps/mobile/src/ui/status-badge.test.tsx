import { render, screen } from '@testing-library/react-native';
import { initI18n } from '@/i18n';
import { StatusBadge } from './status-badge';

beforeAll(() => {
  initI18n('az');
});

describe('StatusBadge', () => {
  it('translates order statuses', async () => {
    await render(<StatusBadge kind="order" status="IN_PROGRESS" />);
    expect(screen.getByText('İcradadır')).toBeTruthy();
  });

  it('translates delivery statuses', async () => {
    await render(<StatusBadge kind="delivery" status="EN_ROUTE" size="sm" />);
    expect(screen.getByText('Yoldadır')).toBeTruthy();
  });
});
