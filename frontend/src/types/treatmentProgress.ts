export interface TreatmentProgress {
  treatmentProgressID: number
  dentistID: number
  dentistName?: string
  treatmentRecordID: number
  patientID: number
  patientName?: string
  progressName?: string
  progressContent?: string
  status?: string
  duration?: number
  description?: string
  endTime?: string
  note?: string
  createdAt: string
  updatedAt?: string
  createdBy?: number
  updatedBy?: number
}
