import axiosInstance from "@/lib/axios";
import type {
  PrescriptionTemplate,
  CreatePrescriptionTemplateRequest,
  UpdatePrescriptionTemplateRequest,
} from "@/types/prescriptionTemplate";

interface ApiPrescriptionTemplate {
  preTemplateID: number;
  preTemplateName: string;
  preTemplateContext: string;
  createdAt: string;
  updatedAt: string;
}

export const prescriptionTemplateApi = {
  // Get all prescription templates
  getPrescriptionTemplates: async (): Promise<PrescriptionTemplate[]> => {
    const response = await axiosInstance.get("/prescription-templates");
    return response.data.map((item: ApiPrescriptionTemplate) => ({
      PreTemplateID: item.preTemplateID,
      PreTemplateName: item.preTemplateName,
      PreTemplateContext: item.preTemplateContext,
      CreatedAt: item.createdAt,
      UpdatedAt: item.updatedAt, // Use createdAt as UpdatedAt for now
      IsDeleted: false,
    }));
  },

  // Create new prescription template
  createPrescriptionTemplate: async (
    data: CreatePrescriptionTemplateRequest
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.post("/prescription-templates", {
      preTemplateName: data.PreTemplateName,
      preTemplateContext: data.PreTemplateContext,
    });
    return response.data; 
  },

  // Update prescription template
  updatePrescriptionTemplate: async (
    data: UpdatePrescriptionTemplateRequest
  ):  Promise<{ message: string }> => {
    const response = await axiosInstance.put("/prescription-templates", {
      preTemplateID: data.PreTemplateID,
      preTemplateName: data.PreTemplateName,
      preTemplateContext: data.PreTemplateContext,
    });
    return response.data;
  },

  // Deactivate prescription template
  deactivatePrescriptionTemplate: async (id: number): Promise<void> => {
    await axiosInstance.put(`/prescription-templates/deactivate/${id}`);
  },
};
