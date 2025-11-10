import apiClient from './api';
import {
  Product,
  InstallmentRatio,
  InstallmentCalculation,
  CreateInstallmentData,
  InstallmentCreationResponse,
  InstallmentListItem,
  InstallmentFilters,
  InstallmentAgreement,
} from '../types/installment';

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
   * Get available installment ratios
   */
  async getInstallmentRatios(): Promise<InstallmentRatio[]> {
    const response = await apiClient.get<{ success: boolean; data: InstallmentRatio[] }>(
      '/api/installments/ratios'
    );
    return response.data.data;
  }

  /**
   * Calculate installment details
   */
  async calculateInstallment(
    productPrice: number,
    depositAmount: number,
    termMonths: number
  ): Promise<InstallmentCalculation> {
    const response = await apiClient.post<{ success: boolean; data: InstallmentCalculation }>(
      '/api/installments/calculate',
      {
        productPrice,
        depositAmount,
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
}

export default new InstallmentService();
