// Types for prescription
export interface Prescription {
  prescriptionId: number;
  preTemplateId?: number;
  content: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
  isDeleted: boolean;
  appointmentId: number;
}

export interface CreatePrescriptionRequest {
  appointmentId: number;
  contents: string;
}

export interface UpdatePrescriptionRequest {
  prescriptionId: number;
  contents: string;
}

export interface PrescriptionResponse {
  prescriptionId: number;
  appointmentId: number;
  content: string;
  createdAt: string;
  createdBy: string;
}