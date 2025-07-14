export interface PatientImage {
  imageId: number;
  patientId: number;
  treatmentRecordId?: number;
  orthodonticTreatmentPlanId?: number;
  imageURL: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  isDeleted: boolean;
}

export interface CreatePatientImageRequest {
  patientId: number;
  treatmentRecordId?: number;
  orthodonticTreatmentPlanId?: number;
  imageFile: File;
  description?: string;
}

export interface GetPatientImagesParams {
  patientId?: number;
  treatmentRecordId?: number;
  orthodonticTreatmentPlanId?: number;
}

export interface PatientImageResponse {
  data: PatientImage[];
  message?: string;
  success: boolean;
}

export interface CreatePatientImageResponse {
  data: PatientImage;
  message?: string;
  success: boolean;
}