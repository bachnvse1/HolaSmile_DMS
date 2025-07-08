import axiosInstance from '@/lib/axios';
import type { 
  PrescriptionTemplate, 
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest 
} from '@/types/prescriptionTemplate';

interface ApiPrescriptionTemplate {
  preTemplateID: number;
  preTemplateName: string;
  preTemplateContext: string;
  createdAt: string;
}

export const prescriptionTemplateApi = {
  // Get all prescription templates
  getPrescriptionTemplates: async (): Promise<PrescriptionTemplate[]> => {
    const response = await axiosInstance.get('/prescription-templates');
    return response.data.map((item: ApiPrescriptionTemplate) => ({
      PreTemplateID: item.preTemplateID,
      PreTemplateName: item.preTemplateName,
      PreTemplateContext: item.preTemplateContext,
      CreatedAt: item.createdAt,
      UpdatedAt: item.createdAt, // Use createdAt as UpdatedAt for now
      IsDeleted: false
    }));
  },

  // Create new prescription template
  createPrescriptionTemplate: async (data: CreatePrescriptionTemplateRequest): Promise<PrescriptionTemplate> => {
    const response = await axiosInstance.post('/prescription-templates', {
      preTemplateName: data.PreTemplateName,
      preTemplateContext: data.PreTemplateContext
    });
    const item: ApiPrescriptionTemplate = response.data;
    return {
      PreTemplateID: item.preTemplateID,
      PreTemplateName: item.preTemplateName,
      PreTemplateContext: item.preTemplateContext,
      CreatedAt: item.createdAt,
      UpdatedAt: item.createdAt,
      IsDeleted: false
    };
  },

  // Update prescription template
  updatePrescriptionTemplate: async (data: UpdatePrescriptionTemplateRequest): Promise<PrescriptionTemplate> => {
    const response = await axiosInstance.put('/prescription-templates', {
      preTemplateID: data.PreTemplateID,
      preTemplateName: data.PreTemplateName,
      preTemplateContext: data.PreTemplateContext
    });
    const item: ApiPrescriptionTemplate = response.data;
    return {
      PreTemplateID: item.preTemplateID,
      PreTemplateName: item.preTemplateName,
      PreTemplateContext: item.preTemplateContext,
      CreatedAt: item.createdAt,
      UpdatedAt: item.createdAt,
      IsDeleted: false
    };
  },

  // Deactivate prescription template
  deactivatePrescriptionTemplate: async (id: number): Promise<void> => {
    await axiosInstance.put(`/prescription-templates/deactivate/${id}`);
  }
};