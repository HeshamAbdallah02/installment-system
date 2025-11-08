import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PasswordInput from './PasswordInput';

describe('PasswordInput', () => {
  it('should render with label and placeholder', () => {
    const onChange = vi.fn();
    render(<PasswordInput value="" onChange={onChange} />);

    expect(screen.getByLabelText('كلمة المرور')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('أدخل كلمة المرور')).toBeInTheDocument();
  });

  it('should display password as masked by default', () => {
    const onChange = vi.fn();
    render(<PasswordInput value="password123" onChange={onChange} />);

    const input = screen.getByPlaceholderText('أدخل كلمة المرور') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should toggle password visibility when eye icon is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput value="password123" onChange={onChange} />);

    const input = screen.getByPlaceholderText('أدخل كلمة المرور') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('إظهار كلمة المرور');

    expect(input.type).toBe('password');

    await user.click(toggleButton);
    expect(input.type).toBe('text');

    await user.click(toggleButton);
    expect(input.type).toBe('password');
  });

  it('should call onChange when user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PasswordInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('أدخل كلمة المرور');
    await user.type(input, 'test');

    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('should display error message when error prop is provided', () => {
    const onChange = vi.fn();
    render(<PasswordInput value="" onChange={onChange} error="يرجى إدخال كلمة المرور" />);

    expect(screen.getByText('يرجى إدخال كلمة المرور')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const onChange = vi.fn();
    render(<PasswordInput value="" onChange={onChange} disabled={true} />);

    const input = screen.getByPlaceholderText('أدخل كلمة المرور') as HTMLInputElement;
    const toggleButton = screen.getByLabelText('إظهار كلمة المرور') as HTMLButtonElement;

    expect(input).toBeDisabled();
    expect(toggleButton).toBeDisabled();
  });

  it('should auto-focus when autoFocus prop is true', () => {
    const onChange = vi.fn();
    render(<PasswordInput value="" onChange={onChange} autoFocus={true} />);

    const input = screen.getByPlaceholderText('أدخل كلمة المرور');
    expect(input).toHaveFocus();
  });
});
