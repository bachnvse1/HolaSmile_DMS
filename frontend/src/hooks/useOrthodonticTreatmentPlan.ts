import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';
import type { 
  OrthodonticTreatmentPlan, 
  CreateOrthodonticTreatmentPlanRequest, 
  UpdateOrthodonticTreatmentPlanRequest 
} from '@/types/orthodonticTreatmentPlan';

// Get all treatment plans for a patient
export const useOrthodonticTreatmentPlans = (patientId: number) => {
  return useQuery({
    queryKey: ['orthodontic-treatment-plans', patientId],
    queryFn: async () => {
      const response = await axiosInstance.get<OrthodonticTreatmentPlan[]>(
        `/orthodontic-treatment-plans/patient/${patientId}`
      );
      return response.data;
    },
    enabled: !!patientId,
  });
};

// Get single treatment plan
export const useOrthodonticTreatmentPlan = (planId: number) => {
  return useQuery({
    queryKey: ['orthodontic-treatment-plan', planId],
    queryFn: async () => {
      const response = await axiosInstance.get<OrthodonticTreatmentPlan>(
        `/orthodontic-treatment-plans/${planId}`
      );
      return response.data;
    },
    enabled: !!planId,
  });
};

// Create treatment plan
export const useCreateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrthodonticTreatmentPlanRequest) => {
      const response = await axiosInstance.post<OrthodonticTreatmentPlan>(
        '/orthodontic-treatment-plans',
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['orthodontic-treatment-plans', data.patientId] 
      });
      toast.success('Tạo kế hoạch điều trị thành công!');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Có lỗi xảy ra khi tạo kế hoạch điều trị');
    },
  });
};

// Update treatment plan
export const useUpdateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrthodonticTreatmentPlanRequest) => {
      const response = await axiosInstance.put<OrthodonticTreatmentPlan>(
        `/orthodontic-treatment-plans/${data.planId}`,
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['orthodontic-treatment-plans', data.patientId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['orthodontic-treatment-plan', data.planId] 
      });
      toast.success('Cập nhật kế hoạch điều trị thành công!');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Có lỗi xảy ra khi cập nhật kế hoạch điều trị');
    },
  });
};

// Delete treatment plan
export const useDeleteOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: number) => {
      await axiosInstance.delete(`/orthodontic-treatment-plans/${planId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orthodontic-treatment-plans'] });
      toast.success('Xóa kế hoạch điều trị thành công!');
    },
    onError: (error: Error) => {
      toast.error(error?.message || 'Có lỗi xảy ra khi xóa kế hoạch điều trị');
    },
  });
};