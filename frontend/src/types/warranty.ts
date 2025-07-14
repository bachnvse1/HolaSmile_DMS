export interface WarrantyCard {
  warrantyCardId: number
  startDate: string
  endDate: string
  duration: number
  status: boolean
  procedureId: number
  procedureName: string
  patientName: string
  treatmentRecordId?: number
}

export interface CreateWarrantyCard {
  treatmentRecordId: number
  duration: number
}

export interface EditWarrantyCard {
  warrantyCardId: number
  duration: number
  status: boolean
}
