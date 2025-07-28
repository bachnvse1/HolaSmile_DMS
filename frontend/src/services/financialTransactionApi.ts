import axiosInstance from '@/lib/axios';

// Types
export interface FinancialTransaction {
  transactionID: number;
  transactionDate: string;
  description: string;
  transactionType: string | boolean;
  category: string;
  paymentMethod: string | boolean; 
  evidenceImage?: string;
  amount: number;
  createBy: string;
  updateBy: string;
  createAt: string;
  updateAt: string | null;
  isConfirmed?: boolean;
  status?: string;
  createdBy?: number;
  updatedBy?: number | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface CreateTransactionRequest {
  transactionType: boolean; // true: Thu, false: Chi
  description: string;
  amount: number;
  category: string;
  paymentMethod: boolean; // true: Tiền mặt, false: Chuyển khoản
  transactionDate: string;
  evidentImage?: File; // Optional for FormData
}

export interface UpdateTransactionRequest {
  transactionID: number; // Backend expect transactionID
  transactionDate: string;
  description: string;
  transactionType: boolean; // true: Thu, false: Chi
  category: string;
  paymentMethod: boolean; // true: Tiền mặt, false: Chuyển khoản
  amount: number;
  createBy: string;
  updateBy: string;
  createAt: string;
  updateAt: string | null;
}

export interface ApiResponse {
  message?: string;
  status?: boolean;
}

// API Functions
export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => {
  const response = await axiosInstance.get('/transaction/financial-transactions');
  return response.data;
};

export const getExpenseTransactions = async (): Promise<FinancialTransaction[]> => {
  const response = await axiosInstance.get('/transaction/expense-transaction');
  return response.data;
};

export const approveFinancialTransaction = async (transactionId: number, action: boolean = true): Promise<ApiResponse> => {
  const response = await axiosInstance.post('/transaction/approve-financial-transactions', {
    transactionId,
    action
  });
  return response.data;
};

export const getFinancialTransactionDetail = async (transactionId: number): Promise<FinancialTransaction> => {
  const response = await axiosInstance.get(`/transaction/financial-transactions/${transactionId}`);
  return response.data;
};

export const createFinancialTransaction = async (data: CreateTransactionRequest | FormData): Promise<ApiResponse> => {
  const config = data instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  const response = await axiosInstance.post('/transaction/financial-transactions', data, config);
  return response.data;
};

export const updateFinancialTransaction = async (data: UpdateTransactionRequest | FormData): Promise<ApiResponse> => {
  if (data instanceof FormData) {
    // Use axiosInstance for FormData requests 
    const response = await axiosInstance.post('/transaction/edit-financial-transactions', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } else {
    // Use axiosInstance for regular JSON requests
    const response = await axiosInstance.post('/transaction/edit-financial-transactions', data);
    return response.data;
  }
};

export const deactivateFinancialTransaction = async (transactionId: number): Promise<ApiResponse> => {
  const response = await axiosInstance.put(`/transaction/Deactive-financial-transactions/${transactionId}`, {
    transactionId: transactionId,
    action: true
  });
  return response.data;
};

export const exportFinancialTransactions = async (): Promise<Blob> => {
  try {
    const response = await axiosInstance.post('/transaction/export-excel', {}, {
      responseType: 'blob'
    });
    // Kiểm tra xem response có phải là blob không
    if (!(response.data instanceof Blob)) {
      throw new Error('Response is not a blob');
    }
    
    return response.data;
  } catch (error) {
    console.error('Export API error:', error);
    throw error;
  }
};