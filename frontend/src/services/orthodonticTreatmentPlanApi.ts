import axiosInstance from '@/lib/axios';
import type { 
  OrthodonticTreatmentPlan,
  CreateOrthodonticTreatmentPlanRequest,
  UpdateOrthodonticTreatmentPlanRequest
} from '@/types/orthodonticTreatmentPlan';

export const orthodonticTreatmentPlanApi = {
  // Get all orthodontic treatment plans for a patient
  getOrthodonticTreatmentPlans: async (patientId: number): Promise<OrthodonticTreatmentPlan[]> => {
    const response = await axiosInstance.get(`/orthodontic-treatment-plan/view-all?patientId=${patientId}`);
    return response.data.data;
  },

  // Get single orthodontic treatment plan by ID
  getOrthodonticTreatmentPlanById: async (planId: number, patientId: number): Promise<OrthodonticTreatmentPlan> => {
    const response = await axiosInstance.get(`/orthodontic-treatment-plan/${planId}?patientId=${patientId}`);
    return response.data;
  },

  // Create new orthodontic treatment plan 
  createOrthodonticTreatmentPlan: async (data: CreateOrthodonticTreatmentPlanRequest): Promise<OrthodonticTreatmentPlan> => {
    console.log('Creating orthodontic treatment plan with data:', data);
    
    const response = await axiosInstance.post<OrthodonticTreatmentPlan>(
      '/orthodontic-treatment-plan',
      data
    );
    
    console.log('API Response:', response.data);
    return response.data;
  },

  // Update orthodontic treatment plan
  updateOrthodonticTreatmentPlan: async (data: UpdateOrthodonticTreatmentPlanRequest): Promise<void> => {
    await axiosInstance.put('/orthodontic-treatment-plan/update', data);
  },

  // Deactivate orthodontic treatment plan
  deactivateOrthodonticTreatmentPlan: async (planId: number): Promise<void> => {
    await axiosInstance.put(`/orthodontic-treatment-plan/deactive/${planId}`);
  }
};