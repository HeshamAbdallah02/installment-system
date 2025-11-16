/**
 * Date Formatting Utilities
 * Ensures consistent Gregorian calendar usage across the application
 */

/**
 * Format date using Gregorian calendar with Arabic locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Explicitly use Gregorian calendar with Arabic locale
  return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
    ...options,
    calendar: 'gregory', // Explicitly set Gregorian calendar
  }).format(dateObj);
};

/**
 * Format date and time using Gregorian calendar
 */
export const formatDateTime = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('ar-EG-u-ca-gregory', {
    ...options,
    calendar: 'gregory',
  }).format(dateObj);
};

/**
 * Format date in short format (DD/MM/YYYY)
 */
export const formatDateShort = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format date with weekday
 */
export const formatDateWithWeekday = (date: Date | string): string => {
  return formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format month and year only
 */
export const formatMonthYear = (date: Date | string): string => {
  return formatDate(date, {
    year: 'numeric',
    month: 'long',
  });
};

/**
 * Format currency with Arabic locale
 */
export const formatCurrency = (amount: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
};

/**
 * Format number with Arabic locale
 */
export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}): string => {
  return new Intl.NumberFormat('ar-EG', {
    ...options,
  }).format(value);
};
