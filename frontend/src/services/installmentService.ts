import apiClient from './api';
import {
  InstallmentCalculation,
  CreateInstallmentData,
  InstallmentCreationResponse,
  InstallmentListItem,
  InstallmentFilters,
  InstallmentAgreement,
} from '../types/installment';
import { Product } from '../types/product';

/**
 * Service for installment-related API calls
 */
class InstallmentService {
  /**
   * Get all active products with available terms
   */
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<{ success: boolean; data: Product[] }>('/api/products');
    return response.data.data;
  }

  /**
   * Calculate installment details (no deposit)
   */
  async calculateInstallment(
    productPrice: number,
    termMonths: number
  ): Promise<InstallmentCalculation> {
    const response = await apiClient.post<{ success: boolean; data: InstallmentCalculation }>(
      '/api/installments/calculate',
      {
        productPrice,
        termMonths,
      }
    );
    return response.data.data;
  }

  /**
   * Create installment plan
   */
  async createInstallment(data: CreateInstallmentData): Promise<InstallmentCreationResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: InstallmentCreationResponse;
      message: string;
    }>('/api/installments', data);
    return response.data.data;
  }

  /**
   * Get installments with filtering and pagination
   */
  async getInstallments(filters: InstallmentFilters): Promise<{
    data: InstallmentListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: InstallmentListItem[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/installments?${params.toString()}`);

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Get installment agreement for printing
   */
  async getInstallmentAgreement(installmentId: number): Promise<InstallmentAgreement> {
    const response = await apiClient.get<{
      success: boolean;
      data: InstallmentAgreement;
    }>(`/api/installments/${installmentId}/agreement`);
    return response.data.data;
  }

  /**
   * Send bulk reminders for selected installments
   */
  async sendBulkReminders(
    installmentIds: number[],
    method: 'whatsapp' | 'sms' | 'both'
  ): Promise<{
    data: {
      successCount: number;
      failedCount: number;
      failedCustomers: string[];
      invalidPhoneCustomers?: string[];
    };
    message: string;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        successCount: number;
        failedCount: number;
        failedCustomers: string[];
        invalidPhoneCustomers?: string[];
      };
      message: string;
    }>('/api/installments/bulk-reminders', {
      installmentIds,
      method,
    });
    return {
      data: response.data.data,
      message: response.data.message,
    };
  }

  /**
   * Export selected installments to Excel or PDF
   */
  async bulkExport(installmentIds: number[], format: 'excel' | 'pdf'): Promise<Blob> {
    const response = await apiClient.post(
      '/api/installments/bulk-export',
      {
        installmentIds,
        format,
      },
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

export default new InstallmentService();
