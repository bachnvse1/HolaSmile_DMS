import { useQuery } from '@tanstack/react-query';
import { procedureApi } from '@/services/procedureApi';

export const GUEST_PROCEDURE_KEYS = {
  all: ['guestProcedures'] as const,
  list: () => [...GUEST_PROCEDURE_KEYS.all, 'list'] as const,
};

export const useGuestProcedures = () => {
  return useQuery({
    queryKey: GUEST_PROCEDURE_KEYS.list(),
    queryFn: async () => {
      try {
        return await procedureApi.getGuestProcedures();
      } catch (err) {
        const apiErr = err as { response?: { status?: number; data?: { message?: string } } };
        if (apiErr?.response?.status === 500 && apiErr?.response?.data?.message === 'Không có dữ liệu phù hợp') {
          return [];
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};
