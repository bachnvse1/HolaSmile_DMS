import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionApi } from "@/services/prescriptionApi";
import type {
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
} from "@/types/prescription";
import { toast } from "react-toastify";

// Query keys
const PRESCRIPTION_KEYS = {
  all: ["prescriptions"] as const,
  detail: (id: number) => [...PRESCRIPTION_KEYS.all, "detail", id] as const,
  byAppointment: (appointmentId: number) => 
    [...PRESCRIPTION_KEYS.all, "appointment", appointmentId] as const,
};

// Hook for getting prescription by ID
export const usePrescription = (prescriptionId: number) => {
  return useQuery({
    queryKey: PRESCRIPTION_KEYS.detail(prescriptionId),
    queryFn: () => prescriptionApi.getPrescription(prescriptionId),
    enabled: !!prescriptionId,
  });
};

// Hook for getting prescription by appointment ID
export const usePrescriptionByAppointment = (appointmentId: number) => {
  return useQuery({
    queryKey: PRESCRIPTION_KEYS.byAppointment(appointmentId),
    queryFn: () => prescriptionApi.getPrescriptionByAppointment(appointmentId),
    enabled: !!appointmentId,
  });
};

// Hook for creating prescription
export const useCreatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePrescriptionRequest) =>
      prescriptionApi.createPrescription(data),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Tạo đơn thuốc thành công!");
      queryClient.invalidateQueries({
        queryKey: PRESCRIPTION_KEYS.byAppointment(variables.appointmentId),
      });
    },
  });
};

// Hook for updating prescription
export const useUpdatePrescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePrescriptionRequest) =>
      prescriptionApi.updatePrescription(data),
    onSuccess: (response, variables) => {
      toast.success(response.message || "Cập nhật đơn thuốc thành công!");
      queryClient.invalidateQueries({
        queryKey: PRESCRIPTION_KEYS.detail(variables.prescriptionId),
      });
    },
  });
};