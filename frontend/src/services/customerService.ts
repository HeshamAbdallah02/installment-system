import apiClient from './api';
import {
  Customer,
  CustomerDetail,
  CustomerFilters,
  CustomerListResponse,
  CreateCustomerData,
} from '../types/customer';

/**
 * Service for customer-related API calls
 */
class CustomerService {
  /**
   * Get paginated list of customers with search and filters
   */
  async getCustomers(filters: CustomerFilters): Promise<CustomerListResponse> {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<CustomerListResponse>(
      `/api/customers?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get customer by ID with installments and payment history
   */
  async getCustomerById(id: number): Promise<CustomerDetail> {
    const response = await apiClient.get<{ success: boolean; data: CustomerDetail }>(
      `/api/customers/${id}`
    );
    return response.data.data;
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await apiClient.post<{ success: boolean; data: Customer; message: string }>(
      '/api/customers',
      data
    );
    return response.data.data;
  }

  /**
   * Update customer information
   */
  async updateCustomer(id: number, data: Partial<CreateCustomerData>): Promise<Customer> {
    const response = await apiClient.put<{ success: boolean; data: Customer; message: string }>(
      `/api/customers/${id}`,
      data
    );
    return response.data.data;
  }
}

export default new CustomerService();
