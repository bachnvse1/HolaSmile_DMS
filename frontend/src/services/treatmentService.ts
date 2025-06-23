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

  const url = `https://localhost:5001/api/treatment-records/${recordId ?? ""}`

  const response = await fetch(url, {
    method: recordId ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    const result = await response.json()
    if (!response.ok) throw new Error(result.message || "Cập nhật thất bại")
    return result
  } else {
    const text = await response.text()
    throw new Error("Lỗi hệ thống: " + text)
  }
}