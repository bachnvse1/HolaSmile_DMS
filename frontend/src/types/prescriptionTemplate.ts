export interface PrescriptionTemplate {
  PreTemplateID: number;
  PreTemplateName: string;
  PreTemplateContext: string;
  CreatedAt: string;
  UpdatedAt: string;
  IsDeleted: boolean;
}

export interface CreatePrescriptionTemplateRequest {
  PreTemplateName: string;
  PreTemplateContext: string;
}

export interface UpdatePrescriptionTemplateRequest extends CreatePrescriptionTemplateRequest {
  PreTemplateID: number;
}