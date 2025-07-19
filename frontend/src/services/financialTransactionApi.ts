import axiosInstance from '@/lib/axios';

export interface FinancialTransaction {
  transactionID: number;
  invoiceId: number | null;
  transactionDate: string;
  description: string;
  transactionType: string;
  category: string;
  paymentMethod: string;
  amount: number;
}

export interface CreateTransactionRequest {
  description: string;
  transactionType: boolean; // true: Thu, false: Chi
  category: string;
  paymentMethod: boolean; // true: Tiền mặt, false: Chuyển khoản
  amount: number;
  invoiceId?: number;
}

export const financialTransactionApi = {
  // Get all financial transactions
  getFinancialTransactions: async (): Promise<FinancialTransaction[]> => {
    try {
      const response = await axiosInstance.get('/transaction/financial-transactions');
      return response.data;
    } catch (error) {
      console.error('Error getting financial transactions:', error);
      throw error;
    }
  },

  // Create receipt (phiếu thu)
  createReceipt: async (data: CreateTransactionRequest) => {
    try {
      const response = await axiosInstance.post('/transaction/receipt', data);
      return response.data;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  },

  // Create payment (phiếu chi)
  createPayment: async (data: CreateTransactionRequest) => {
    try {
      const response = await axiosInstance.post('/transaction/payment', data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Export transactions
  exportTransactions: async () => {
    try {
      const response = await axiosInstance.get('/transaction/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }
};