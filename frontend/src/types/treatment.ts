export interface FilterFormData {
  searchTerm: string
  filterStatus: string
  filterDentist: string
}

export interface TreatmentRecord {
  treatmentRecordID: number
  appointmentID: number
  appointmentDate: string
  appointmentTime: string
  dentistID: number
  dentistName?: string
  procedureID: number
  procedureName?: string
  toothPosition: string
  quantity: number
  unitPrice: number
  discountAmount: number| null
  discountPercentage: number| null
  totalAmount: number
  consultantEmployeeID: number | null
  treatmentStatus: string
  symptoms: string
  diagnosis: string
  treatmentDate: string
  createdAt: string | null
  updatedAt: string | null
  createdBy: number | null
  updatedBy: number | null
  isDeleted: boolean
  remainingAmount: number
}

export interface TreatmentFormData {
  appointmentID: number
  treatmentToday?: boolean;
  dentistID: number
  procedureID: number
  toothPosition: string
  quantity: number
  unitPrice: number
  discountAmount: number
  discountPercentage: number
  consultantEmployeeID: number
  treatmentStatus: string
  symptoms: string
  diagnosis: string
  treatmentDate: string
}
