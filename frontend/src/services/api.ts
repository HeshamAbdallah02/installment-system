import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token here when implemented
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlan {
  id: string;
  saleId: string;
  customerId: string;
  totalAmount: number;
  numberOfInstallments: number;
  frequency: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  installmentPlanId: string;
  amount: number;
  dueDate: string;
  status: string;
  installmentNumber: number;
  createdAt: string;
  updatedAt: string;
}

// API functions (placeholder implementations)
export const getCustomers = async (): Promise<Customer[]> => {
  const response = await apiClient.get<Customer[]>('/api/customers');
  return response.data;
};

export const getCustomer = async (id: string): Promise<Customer> => {
  const response = await apiClient.get<Customer>(`/api/customers/${id}`);
  return response.data;
};

export const getInstallmentPlans = async (): Promise<InstallmentPlan[]> => {
  const response = await apiClient.get<InstallmentPlan[]>('/api/installment-plans');
  return response.data;
};

export const getInstallments = async (): Promise<Installment[]> => {
  const response = await apiClient.get<Installment[]>('/api/installments');
  return response.data;
};

export const checkHealth = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await apiClient.get('/health');
  return response.data;
};

export default apiClient;
