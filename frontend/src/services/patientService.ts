import axiosInstance from "@/lib/axios" 
import type { Patient } from "@/types/patient" 


export const getAllPatients = async (): Promise<Patient[]> => {
  const response = await axiosInstance.get("/patient")
  return response.data
}


