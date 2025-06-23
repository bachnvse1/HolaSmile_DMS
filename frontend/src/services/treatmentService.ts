import axiosInstance from "@/lib/axios"
import type { TreatmentRecord } from "@/types/treatment"
import type { TreatmentFormData } from "@/types/treatment"

export const getTreatmentRecordsByUser = async (userId: number): Promise<TreatmentRecord[]> => {
  const response = await axiosInstance.get<TreatmentRecord[]>(`/treatment-records?userId=${userId}`)
  return response.data
}

export const createOrUpdateTreatmentRecord = async (
  data: TreatmentFormData,
  totalAmount: number,
  updatedBy: number,
  recordId?: number
) => {
  const payload = {
    toothPosition: data.toothPosition,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    discountPercentage: data.discountPercentage,
    discountAmount: data.discountAmount,
    totalAmount,
    treatmentStatus: data.treatmentStatus,
    symptoms: data.symptoms,
    diagnosis: data.diagnosis,
    treatmentDate: new Date(data.treatmentDate).toISOString(),
    updatedBy,
  }

  try {

    const response = recordId
      ? await axiosInstance.put(`/treatment-records/${recordId}`, payload)
      : await axiosInstance.post("/treatment-records", payload)

    return response.data
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    }

    throw new Error("Lỗi hệ thống: " + (error.message || "Không xác định"))
  }
}
