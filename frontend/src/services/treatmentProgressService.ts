import axiosInstance from "@/lib/axios"
import type { TreatmentProgress } from "@/types/treatmentProgress"

export const getTreatmentProgressById = async (
  id: string
): Promise<TreatmentProgress[]> => {
  const response = await axiosInstance.get(`/treatment-progress/${id}`)
  return response.data
}

export async function createTreatmentProgress(data: Omit<TreatmentProgress, "treatmentProgressID">) {
  const response = await axiosInstance.post("/treatment-progress", data)
  return response.data
}