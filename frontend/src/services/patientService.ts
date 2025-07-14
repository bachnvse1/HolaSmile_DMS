import axiosInstance from "@/lib/axios"
import type { Patient } from "@/types/patient"


export const getAllPatients = async (): Promise<Patient[]> => {
  const response = await axiosInstance.get("/patient")
  return response.data
}

export const updatePatient = async (patientId: number,data: any) => {
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
