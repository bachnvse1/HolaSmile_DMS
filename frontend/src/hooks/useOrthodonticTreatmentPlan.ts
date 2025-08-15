import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/formatUtils";

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

export interface OrthodonticTreatmentPlan
  extends CreateOrthodonticTreatmentPlanRequest {
  planId: number;
  consultationDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  isDeleted: boolean;
}

// Query keys
const ORTHODONTIC_KEYS = {
  all: ["orthodontic-treatment-plans"] as const,
  lists: () => [...ORTHODONTIC_KEYS.all, "list"] as const,
  list: (patientId: number) =>
    [...ORTHODONTIC_KEYS.lists(), { patientId }] as const,
  details: () => [...ORTHODONTIC_KEYS.all, "detail"] as const,
  detail: (planId: number, patientId: number) =>
    [...ORTHODONTIC_KEYS.details(), { planId, patientId }] as const,
};

// Create treatment plan
export const useCreateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrthodonticTreatmentPlanRequest) => {
      const response = await axiosInstance.post<OrthodonticTreatmentPlan>(
        "/orthodontic-treatment-plan",
        data
      );

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["orthodontic-treatment-plans", data.patientId],
      });
      toast.success("Tạo kế hoạch điều trị thành công!");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error) || "Có lỗi xảy ra khi tạo kế hoạch điều trị"
      );
    },
  });
};

// Get all orthodontic treatment plans for a patient
export const useOrthodonticTreatmentPlans = (
  patientId: number
) => {
  return useQuery({
    queryKey: ['orthodontic-treatment-plans', patientId],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/orthodontic-treatment-plan/view-all?patientId=${patientId}`
        );
        return response.data.data;
      } catch (error) {
        console.error('Error fetching treatment plans:', error);
        throw error;
      }
    },
    enabled: patientId > 0,
    retry: (failureCount, error) => {
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Get single orthodontic treatment plan
export const useOrthodonticTreatmentPlan = (
  planId: number,
  patientId: number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ORTHODONTIC_KEYS.detail(planId, patientId),
    queryFn: async () => {
      try {
        const response = await axiosInstance.get(
          `/orthodontic-treatment-plan/${planId}?patientId=${patientId}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching treatment plan:", error);
        throw error;
      }
    },
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!planId && !!patientId && planId > 0 && patientId > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryOnMount: false,
    retryDelay: 1000,
    gcTime: 5 * 60 * 1000, 
    networkMode: "always",
  });
};

// Update orthodontic treatment plan (edit mode)
export interface UpdateOrthodonticTreatmentPlanRequest {
  planId: number;
  patientId: number;
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
  startToday?: boolean;
  consultationDate?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  isDeleted?: boolean;
}

// Update orthodontic treatment plan (similar to create)
export const useUpdateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateOrthodonticTreatmentPlanRequest) => {
      const response = await axiosInstance.put(
        "/orthodontic-treatment-plan/update",
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ORTHODONTIC_KEYS.all,
      });
      toast.success("Cập nhật kế hoạch điều trị thành công!");
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error) || "Có lỗi xảy ra khi cập nhật kế hoạch điều trị"
      );
    },
  });
};

// Deactivate orthodontic treatment plan
export const useDeactivateOrthodonticTreatmentPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: number) => {
      await axiosInstance.put(`/orthodontic-treatment-plan/deactive/${planId}`);
    },
    onSuccess: () => {
      toast.success("Xóa kế hoạch điều trị thành công!");
      queryClient.invalidateQueries({
        queryKey: ORTHODONTIC_KEYS.all,
      });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error) || "Có lỗi xảy ra khi xóa kế hoạch điều trị"
      );
    },
  });
};