import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionApi} from '@/services/promotionApi';
import type { UpdatePromotionRequest, CreatePromotionRequest } from '@/types/promotion.types';
// Query keys
const PROMOTION_KEYS = {
  all: ['promotions'] as const,
  lists: () => [...PROMOTION_KEYS.all, 'list'] as const,
  detail: (id: number) => [...PROMOTION_KEYS.all, 'detail', id] as const,
};

// Hook for getting all promotion programs
export const usePromotionPrograms = () => {
  return useQuery({
    queryKey: PROMOTION_KEYS.lists(),
    queryFn: async () => {
      try {
        return await promotionApi.getPromotionPrograms();
      } catch (error: unknown) {
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

// Hook for getting promotion program detail
export const usePromotionProgramDetail = (programId: number) => {
  return useQuery({
    queryKey: PROMOTION_KEYS.detail(programId),
    queryFn: () => promotionApi.getPromotionProgramDetail(programId),
    enabled: !!programId,
    staleTime: 5 * 60 * 1000,
  });
};

// Hook for creating promotion program
export const useCreatePromotionProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePromotionRequest) =>
      promotionApi.createPromotionProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PROMOTION_KEYS.lists(),
      });
    },
  });
};

// Hook for updating promotion program
export const useUpdatePromotionProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePromotionRequest) =>
      promotionApi.updatePromotionProgram(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: PROMOTION_KEYS.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: PROMOTION_KEYS.detail(variables.programId),
      });
    },
  });
};

// Hook for deactivating promotion program
export const useDeactivatePromotionProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (programId: number) =>
      promotionApi.deactivatePromotionProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: PROMOTION_KEYS.lists(),
      });
    },
  });
};