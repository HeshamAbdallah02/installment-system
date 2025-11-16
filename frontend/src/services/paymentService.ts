import apiClient from './api';
import type {
  TodaysDuesResponse,
  OverdueDuesResponse,
  PaymentFormData,
  Payment,
  ReceiptData,
} from '../types/payment';

/**
 * Get today's dues for the logged-in user's branch
 */
export const getTodaysDues = async (): Promise<TodaysDuesResponse> => {
  const response = await apiClient.get<{ success: boolean; data: TodaysDuesResponse }>(
    '/api/payments/today'
  );
  return response.data.data;
};

/**
 * Get overdue payments for the logged-in user's branch
 */
export const getOverdueDues = async (): Promise<OverdueDuesResponse> => {
  const response = await apiClient.get<{ success: boolean; data: OverdueDuesResponse }>(
    '/api/payments/overdue'
  );
  return response.data.data;
};

/**
 * Record a single payment
 */
export const recordPayment = async (
  scheduleId: number,
  data: PaymentFormData
): Promise<Payment> => {
  const response = await apiClient.post<Payment>('/api/payments', {
    scheduleId,
    ...data,
  });
  return response.data;
};

/**
 * Record multiple payments for the same customer
 */
export const recordMultiplePayments = async (
  scheduleIds: number[],
  data: PaymentFormData
): Promise<{ payments: Payment[]; totalAmount: number; count: number }> => {
  const response = await apiClient.post('/api/payments/multiple', {
    scheduleIds,
    paymentMethod: data.paymentMethod,
    referenceNumber: data.referenceNumber,
    checkNumber: data.checkNumber,
    bankName: data.bankName,
    paymentDate: data.paymentDate,
    notes: data.notes,
  });
  return response.data;
};

/**
 * Get receipt data for a payment
 */
export const getReceiptData = async (paymentId: number): Promise<ReceiptData> => {
  const response = await apiClient.get<ReceiptData>(`/api/payments/${paymentId}/receipt`);
  return response.data;
};

/**
 * Get payment history with filtering and pagination
 */
export const getPaymentHistory = async (
  filters: import('../types/payment').PaymentHistoryFilters
): Promise<import('../types/payment').PaymentHistoryResponse> => {
  const params = new URLSearchParams();

  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.search) params.append('search', filters.search);
  if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
  if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters.branch) params.append('branch', filters.branch.toString());
  if (filters.collector) params.append('collector', filters.collector.toString());

  const response = await apiClient.get(`/api/payments?${params.toString()}`);
  return {
    payments: response.data.data,
    pagination: response.data.pagination,
    totalAmount: response.data.totalAmount,
  };
};

/**
 * Get payment details by ID
 */
export const getPaymentById = async (paymentId: number): Promise<Payment> => {
  const response = await apiClient.get<{ data: Payment }>(`/api/payments/${paymentId}`);
  return response.data.data;
};

/**
 * Get detailed payment information by ID
 */
export const getPaymentDetails = async (
  paymentId: number
): Promise<import('../types/payment').PaymentDetails> => {
  const response = await apiClient.get<{ data: import('../types/payment').PaymentDetails }>(
    `/api/payments/${paymentId}/details`
  );
  return response.data.data;
};

/**
 * Get upcoming installments for a customer (for advance payments)
 */
export const getUpcomingInstallments = async (
  customerId: number
): Promise<import('../types/payment').UpcomingInstallmentsResponse> => {
  const response = await apiClient.get<import('../types/payment').UpcomingInstallmentsResponse>(
    `/api/payments/upcoming/${customerId}`
  );
  return response.data;
};

/**
 * Record an advance payment
 */
export const recordAdvancePayment = async (
  scheduleId: number,
  data: PaymentFormData
): Promise<Payment> => {
  const response = await apiClient.post<Payment>('/api/payments/advance', {
    scheduleId,
    ...data,
  });
  return response.data;
};
