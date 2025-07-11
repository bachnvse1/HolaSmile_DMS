import axiosInstance from "@/lib/axios";
import type {
  PrescriptionResponse,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
} from "@/types/prescription";

// Simple cache to store known prescription mappings
const prescriptionCache = new Map<number, PrescriptionResponse | null>();

export const prescriptionApi = {
  // Get prescription by ID
  getPrescription: async (prescriptionId: number): Promise<PrescriptionResponse> => {
    const response = await axiosInstance.get(`/prescription/${prescriptionId}`);
    
    // Cache the result by appointmentId for future lookups
    if (response.data && response.data.appointmentId) {
      prescriptionCache.set(response.data.appointmentId, response.data);
    }
    
    return response.data;
  },

  // ...existing code...

  // Get prescription by appointment ID
  getPrescriptionByAppointment: async (appointmentId: number): Promise<PrescriptionResponse | null> => {
    // Check cache first
    if (prescriptionCache.has(appointmentId)) {
      return prescriptionCache.get(appointmentId) || null;
    }
    
    // Try common prescriptionId patterns
    const possibleIds = [
      appointmentId, // prescriptionId = appointmentId
      appointmentId + 1, // prescriptionId = appointmentId + 1
      appointmentId - 1, // prescriptionId = appointmentId - 1
    ];
    
    for (const prescriptionId of possibleIds) {
      try {
        const response = await axiosInstance.get(`/prescription/${prescriptionId}`);
        
        if (response.data && response.data.appointmentId === appointmentId) {
          // Cache the result
          prescriptionCache.set(appointmentId, response.data);
          return response.data;
        }
      } catch {
        // Continue to next possible ID
        continue;
      }
    }
    
    // Cache null result to avoid repeated API calls
    prescriptionCache.set(appointmentId, null);
    return null;
  },
};