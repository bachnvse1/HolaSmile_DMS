export interface Patient {
  userId: number
  patientId: number
  fullname: string
  gender: string
  phone: string
  dob: string
  email: string
  address?: string
  underlyingConditions?: string
}

export interface EditPatientForm {
  fullName: string
  dob: string
  gender: boolean
  email: string
  address: string
  underlyingConditions?: string
}


