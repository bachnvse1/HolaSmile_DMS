import axiosInstance from "@/lib/axios"
import type { Patient } from "@/types/patient"

// Interface cho patient detail response
export interface PatientDetail {
  patientId: number
  fullName: string
  phone: string
  email: string
  address: string
  dob: string 
  gender: boolean 
  patientGroup: string | null
  underlyingConditions: string | null
  avatar: string 
}

export const getAllPatients = async (): Promise<Patient[]> => {
  const response = await axiosInstance.get("/patient")
  return response.data
}

export const getPatientById = async (patientId: number): Promise<PatientDetail> => {
  const response = await axiosInstance.get(`/patient/${patientId}`)
  return response.data
}

export const updatePatient = async (patientId: number, data: any) => {
  const response = await axiosInstance.put(`/Receptionist/patients`, {
    patientID: patientId, 
    fullName: data.fullname,
    dob: data.dob,
    gender: data.gender === "Male",
    email: data.email,
    address: data.address ?? "",
    underlyingConditions: data.underlyingConditions ?? ""
  })
  return response.data
}