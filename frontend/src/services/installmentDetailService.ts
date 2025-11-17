import apiClient from './api';
import { extractApiError, ApiError } from '../constants/errors';

/**
 * Service for installment detail operations
 * Requirements: 1.1, 6.1, 7.1, 9.1, 12.1, 14.1, 15.1
 */
class InstallmentDetailService {
  /**
   * Get comprehensive installment detail
   * Requirements: 1.1, 1.2, 1.8, 1.9
   */
  async getInstallmentDetail(installmentId: number): Promise<Record<string, unknown>> {
    try {
      const response = await apiClient.get(`/api/installments/${installmentId}/detail`);
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Record payment from detail page
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9
   */
  async recordPayment(
    installmentId: number,
    scheduleId: number,
    amount: number,
    paymentMethod: string,
    paymentDate: Date,
    notes?: string
  ): Promise<{ payment: Record<string, unknown>; updatedSchedule: Record<string, unknown> }> {
    try {
      const response = await apiClient.post(`/api/installments/${installmentId}/payment`, {
        scheduleId,
        amount,
        paymentMethod,
        paymentDate: paymentDate.toISOString(),
        notes,
      });
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Send payment reminder
   * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   */
  async sendReminder(
    installmentId: number,
    method: 'whatsapp' | 'sms' | 'both',
    scheduleId?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`/api/installments/${installmentId}/reminder`, {
        method,
        scheduleId,
      });
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Process early settlement
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9
   */
  async processEarlySettlement(
    installmentId: number,
    discountPercentage: number,
    paymentMethod: string,
    paymentDate: Date,
    approvedBy?: number
  ): Promise<{ settlement: Record<string, unknown>; finalPayment: Record<string, unknown> }> {
    try {
      const response = await apiClient.post(`/api/installments/${installmentId}/early-settlement`, {
        discountPercentage,
        paymentMethod,
        paymentDate: paymentDate.toISOString(),
        approvedBy,
      });
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Modify installment terms
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9
   */
  async modifyTerms(
    installmentId: number,
    monthlyAmount: number | undefined,
    termMonths: number | undefined,
    interestRate: number | undefined,
    reason: string,
    approvedBy: number
  ): Promise<{
    updatedPlan: Record<string, unknown>;
    newSchedule: Array<Record<string, unknown>>;
  }> {
    try {
      const response = await apiClient.put(`/api/installments/${installmentId}/modify-terms`, {
        monthlyAmount,
        termMonths,
        interestRate,
        reason,
        approvedBy,
      });
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Cancel installment
   * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9
   */
  async cancelInstallment(
    installmentId: number,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(`/api/installments/${installmentId}/cancel`, {
        reason,
      });
      return response.data.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }

  /**
   * Export installment details
   * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7
   */
  async exportInstallmentDetail(
    installmentId: number,
    format: 'pdf' | 'excel',
    options: {
      includeSchedule?: boolean;
      includePayments?: boolean;
      includeCustomer?: boolean;
      includeActivities?: boolean;
    }
  ): Promise<Blob> {
    try {
      const response = await apiClient.post(`/api/installments/${installmentId}/export`, {
        format,
        options,
      });
      return response.data;
    } catch (error) {
      throw extractApiError(error);
    }
  }
}

export default new InstallmentDetailService();
export type { ApiError };
