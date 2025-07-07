import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';

export interface CreateOrthodonticTreatmentPlanRequest {
  patientId: number;
  dentistId: number;
  planTitle: string;
  templateName: string;
  treatmentHistory: string;
  reasonForVisit: string;
  examinationFindings: string;
  intraoralExam: string;
  xRayAnalysis: string;
  modelAnalysis: string;
  treatmentPlanContent: string;
  totalCost: number;
  paymentMethod: string;
  startToday: boolean;
}

export interface OrthodonticTreatmentPlan extends CreateOrthodonticTreatmentPlanRequest {
  planId: number;
  consultationDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  isDeleted: boolean;
}

// Create treatment plan
export const useCreateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrthodonticTreatmentPlanRequest) => {
      console.log('Creating orthodontic treatment plan with data:', data);
      
      const response = await axiosInstance.post<OrthodonticTreatmentPlan>(
        '/orthodontic-treatment-plan',
        data
      );
      
      console.log('API Response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ['orthodontic-treatment-plans', data.patientId] 
      });
      toast.success('Tạo kế hoạch điều trị thành công!');
    },
    onError: (error: unknown) => {
      console.error('API Error in hook:', error);
      
      // Type-safe error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        const errorMessage = apiError.response?.data?.message || 'Có lỗi xảy ra khi tạo kế hoạch điều trị';
        toast.error(errorMessage);
      } else {
        toast.error('Có lỗi xảy ra khi tạo kế hoạch điều trị');
      }
    },
  });
};