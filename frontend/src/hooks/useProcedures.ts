import { useQuery } from '@tanstack/react-query';
import { procedureApi } from '@/services/procedureApi';

// Query keys
const PROCEDURE_KEYS = {
  all: ['procedures'] as const,
  lists: () => [...PROCEDURE_KEYS.all, 'list'] as const,
};

// Hook for getting all procedures
export const useProcedures = () => {
  return useQuery({
    queryKey: PROCEDURE_KEYS.lists(),
    queryFn: async () => {
      try {
        return await procedureApi.getProcedures();
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