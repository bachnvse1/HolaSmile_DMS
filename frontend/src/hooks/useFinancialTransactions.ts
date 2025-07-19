import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialTransactionApi, type CreateTransactionRequest } from '@/services/financialTransactionApi';

// Query keys
const FINANCIAL_TRANSACTION_KEYS = {
  all: ['financial-transactions'] as const,
  lists: () => [...FINANCIAL_TRANSACTION_KEYS.all, 'list'] as const,
};

// Hook for getting all financial transactions
export const useFinancialTransactions = () => {
  return useQuery({
    queryKey: FINANCIAL_TRANSACTION_KEYS.lists(),
    queryFn: async () => {
      try {
        return await financialTransactionApi.getFinancialTransactions();
      } catch (error: unknown) {
        // Handle empty data case
        const apiError = error as { response?: { status?: number; data?: { message?: string } } };
        if (apiError?.response?.status === 500 && 
            apiError?.response?.data?.message === "Không có dữ liệu phù hợp") {
          return [];
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for creating receipt
export const useCreateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      financialTransactionApi.createReceipt(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FINANCIAL_TRANSACTION_KEYS.lists(),
      });
    },
  });
};

// Hook for creating payment
export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      financialTransactionApi.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: FINANCIAL_TRANSACTION_KEYS.lists(),
      });
    },
  });
};

// Hook for exporting transactions
export const useExportTransactions = () => {
  return useMutation({
    mutationFn: () => financialTransactionApi.exportTransactions(),
    onSuccess: (data) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `giao-dich-tai-chinh-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};