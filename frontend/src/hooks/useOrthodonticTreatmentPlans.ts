import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { OrthodonticTreatmentPlan } from '../types/orthodontic';

const API_URL = '/api/orthodontic-treatment-plans';

export function useOrthodonticTreatmentPlans() {
  const queryClient = useQueryClient();

  // Lấy danh sách kế hoạch điều trị
  const listQuery = useQuery<OrthodonticTreatmentPlan[]>({
    queryKey: ['orthodontic-treatment-plans'],
    queryFn: async () => {
      const res = await axios.get(API_URL);
      return res.data;
    },
  });

  // Lấy chi tiết theo id
  const getById = async (id: number) => {
    const res = await axios.get(`${API_URL}/${id}`);
    return res.data as OrthodonticTreatmentPlan;
  };

  // Tạo mới
  const createMutation = useMutation({
    mutationFn: async (data: Partial<OrthodonticTreatmentPlan>) => {
      const res = await axios.post(API_URL, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontic-treatment-plans'] });
    },
  });

  // Cập nhật
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<OrthodonticTreatmentPlan> }) => {
      const res = await axios.put(`${API_URL}/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontic-treatment-plans'] });
    },
  });

  // Xóa
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await axios.delete(`${API_URL}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontic-treatment-plans'] });
    },
  });

  return {
    listQuery,
    getById,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
