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
    // Add auth token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add timestamp as cache buster for GET requests
    // This ensures the browser treats each request as unique
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear expired token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        // Store the current path to redirect back after login
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/') {
          sessionStorage.setItem('redirect_after_login', currentPath);
        }

        // Store a message to show on login page
        sessionStorage.setItem(
          'session_expired_message',
          'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى'
        );

        // Redirect to login
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      error.isNetworkError = true;
      error.message = 'خطأ في الاتصال. يرجى التحقق من الاتصال بالإنترنت';
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      error.isTimeoutError = true;
      error.message = 'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى';
    }

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
