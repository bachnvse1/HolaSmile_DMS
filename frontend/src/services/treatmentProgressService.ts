import axiosInstance from "@/lib/axios"
import type { TreatmentProgress } from "@/types/treatmentProgress"

export const getTreatmentProgressById = async (
  id: string
): Promise<TreatmentProgress> => {
  const response = await axiosInstance.get<TreatmentProgress>(`/treatmentprogress/${id}`)
  return response.data
}
