import axiosInstance from "@/lib/axios"
import type { TreatmentRecord } from "@/types/treatment"

export const getTreatmentRecordsByUser = async (userId: number): Promise<TreatmentRecord[]> => {
  const response = await axiosInstance.get<TreatmentRecord[]>(`/treatment-records?userId=${userId}`)
  return response.data
}