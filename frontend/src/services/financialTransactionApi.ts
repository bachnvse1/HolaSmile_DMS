import axiosInstance from '@/lib/axios';
import type {
  FinancialTransaction,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  ApiResponse
} from '@/types/financial.types';

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
  const config = data instanceof FormData ? {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } : {};
  
  const response = await axiosInstance.put('/transaction/edit-financial-transactions', data, config);
  return response.data;
};

export const deactivateFinancialTransaction = async (transactionId: number): Promise<ApiResponse> => {
  const response = await axiosInstance.put(`/transaction/Deactive-financial-transactions/${transactionId}`);
  return response.data;
};

export const exportFinancialTransactions = async (): Promise<Blob> => {
  try {
    const response = await axiosInstance.post('/transaction/export-excel', {}, {
      responseType: 'blob'
    });
    if (!(response.data instanceof Blob)) {
      throw new Error('Response is not a blob');
    }
    
    return response.data;
  } catch (error) {
    console.error('Export API error:', error);
    throw error;
  }
};