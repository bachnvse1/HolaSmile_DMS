import axiosInstance from "@/lib/axios";
import type {
  PrescriptionResponse,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
} from "@/types/prescription";

export const prescriptionApi = {
  // Get prescription by ID
  getPrescription: async (prescriptionId: number): Promise<PrescriptionResponse> => {
    const response = await axiosInstance.get(`/prescription/${prescriptionId}`);
    return response.data;
  },

  // Create new prescription
  createPrescription: async (
    data: CreatePrescriptionRequest
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post("/prescription/create", data);
    return response.data;
  },

  // Update prescription
  updatePrescription: async (
    data: UpdatePrescriptionRequest
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.put("/prescription/edit", data);
    return response.data;
  },

  // Get prescription by appointment ID 
  getPrescriptionByAppointment: async (appointmentId: number): Promise<PrescriptionResponse | null> => {
    try {
      const appointmentResponse = await axiosInstance.get(`/appointment/${appointmentId}`);
      const appointment = appointmentResponse.data;
      
      if (!appointment.isExistPrescription || !appointment.prescriptionId) {
        return null;
      }
      
      const prescriptionResponse = await axiosInstance.get(`/prescription/${appointment.prescriptionId}`);
      return prescriptionResponse.data;
    } catch (error) {
      console.error('Error getting prescription by appointment:', error);
      return null;
    }
  },
};