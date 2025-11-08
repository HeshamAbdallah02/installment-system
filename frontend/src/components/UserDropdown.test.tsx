import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDropdown from './UserDropdown';
import type { User } from '../types/auth';

describe('UserDropdown', () => {
  const mockUsers: User[] = [
    { id: '1', fullName: 'أحمد محمد', branchName: 'فرع القاهرة', isActive: true },
    { id: '2', fullName: 'فاطمة علي', branchName: 'فرع الإسكندرية', isActive: true },
    { id: '3', fullName: 'محمود حسن', branchName: 'فرع الجيزة', isActive: true },
  ];

  it('should render with label and placeholder', () => {
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} />);

    expect(screen.getByText('اختر المستخدم')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ابحث عن المستخدم...')).toBeInTheDocument();
  });

  it('should display selected user in correct format', () => {
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId="1" onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...') as HTMLInputElement;
    expect(input.value).toBe('أحمد محمد (فرع القاهرة)');
  });

  it('should filter users by Arabic name when typing', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...');

    await user.click(input);
    await user.type(input, 'أحمد');

    await waitFor(() => {
      expect(screen.getByText(/أحمد محمد/)).toBeInTheDocument();
      expect(screen.queryByText(/فاطمة علي/)).not.toBeInTheDocument();
    });
  });

  it('should filter users by branch name', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...');

    await user.click(input);
    await user.type(input, 'الإسكندرية');

    await waitFor(() => {
      expect(screen.getByText(/فاطمة علي/)).toBeInTheDocument();
      expect(screen.queryByText(/أحمد محمد/)).not.toBeInTheDocument();
    });
  });

  it('should show "لا توجد نتائج" when no users match search', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...');

    await user.click(input);
    await user.type(input, 'xyz123');

    await waitFor(() => {
      expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
    });
  });

  it('should have correct structure for user selection', () => {
    const onSelect = vi.fn();
    render(<UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} />);

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('role', 'combobox');
  });

  it('should display error message when error prop is provided', () => {
    const onSelect = vi.fn();
    render(
      <UserDropdown
        users={mockUsers}
        selectedUserId={null}
        onSelect={onSelect}
        error="يرجى اختيار المستخدم"
      />
    );

    expect(screen.getByText('يرجى اختيار المستخدم')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onSelect = vi.fn();
    render(
      <UserDropdown users={mockUsers} selectedUserId={null} onSelect={onSelect} disabled={true} />
    );

    const input = screen.getByPlaceholderText('ابحث عن المستخدم...') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
