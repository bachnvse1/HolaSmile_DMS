// Định nghĩa type cho kế hoạch điều trị chỉnh nha
export interface OrthodonticTreatmentPlan {
  planId: number;
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
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
  isDeleted: boolean;
}
