import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToastNotification from './ToastNotification';

describe('ToastNotification', () => {
  it('should not render when isVisible is false', () => {
    const onClose = vi.fn();
    render(
      <ToastNotification message="Test message" type="info" isVisible={false} onClose={onClose} />
    );

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should render success toast with correct styling', () => {
    const onClose = vi.fn();
    render(
      <ToastNotification
        message="تم تسجيل الدخول بنجاح"
        type="success"
        isVisible={true}
        onClose={onClose}
        duration={0}
      />
    );

    expect(screen.getByText('تم تسجيل الدخول بنجاح')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50');
  });

  it('should render error toast with correct styling', () => {
    const onClose = vi.fn();
    render(
      <ToastNotification
        message="خطأ في تسجيل الدخول"
        type="error"
        isVisible={true}
        onClose={onClose}
        duration={0}
      />
    );

    expect(screen.getByText('خطأ في تسجيل الدخول')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50');
  });

  it('should render info toast with correct styling', () => {
    const onClose = vi.fn();
    render(
      <ToastNotification
        message="معلومة"
        type="info"
        isVisible={true}
        onClose={onClose}
        duration={0}
      />
    );

    expect(screen.getByText('معلومة')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50');
  });

  it('should have close button', () => {
    const onClose = vi.fn();
    render(
      <ToastNotification
        message="Test message"
        type="info"
        isVisible={true}
        onClose={onClose}
        duration={0}
      />
    );

    const closeButton = screen.getByLabelText('إغلاق');
    expect(closeButton).toBeInTheDocument();
  });
});
