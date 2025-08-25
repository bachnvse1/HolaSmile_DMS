import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatbotApi } from '@/services/chatbotService';
import { toast } from 'react-toastify';

// Query keys
const CHATBOT_KEYS = {
  all: ['chatbot'] as const,
  knowledge: () => [...CHATBOT_KEYS.all, 'knowledge'] as const,
};

// Hook for getting all chatbot knowledge
export const useChatbotKnowledge = () => {
  const queryClient = useQueryClient();

  const knowledgeQuery = useQuery({
    queryKey: CHATBOT_KEYS.knowledge(),
    queryFn: async () => {
      try {
        const data = await chatbotApi.getAllKnowledge();
        return data.sort((a, b) => b.id - a.id);
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

  const updateMutation = useMutation({
    mutationFn: (data: { knowledgeId: number; newAnswer: string; newQuestion: string }) =>
      chatbotApi.updateKnowledge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHATBOT_KEYS.knowledge(),
      });
      toast.success('Cập nhật thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi cập nhật');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { question: string; answer: string }) =>
      chatbotApi.createKnowledge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHATBOT_KEYS.knowledge(),
      });
      toast.success('Tạo mới thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi tạo mới');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (knowledgeId: number) =>
      chatbotApi.deleteKnowledge(knowledgeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: CHATBOT_KEYS.knowledge(),
      });
      toast.success('Xóa thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Lỗi xóa');
    },
  });

  const knowledge = knowledgeQuery.data || [];

  const getStatistics = () => {
    return {
      total: knowledge.length,
      new: knowledge.filter(item => item.category === 'new').length,
      updated: knowledge.filter(item => item.category === 'update').length
    };
  };

  return {
    knowledge,
    loading: knowledgeQuery.isLoading,
    updating: updateMutation.isPending || createMutation.isPending || deleteMutation.isPending,
    refetch: knowledgeQuery.refetch,
    updateKnowledge: updateMutation.mutateAsync,
    createKnowledge: createMutation.mutateAsync,
    deleteKnowledge: deleteMutation.mutateAsync,
    getStatistics
  };
};