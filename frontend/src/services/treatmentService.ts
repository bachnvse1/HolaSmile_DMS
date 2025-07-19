import axiosInstance from "@/lib/axios"
import type { TreatmentRecord } from "@/types/treatment"
import type { TreatmentFormData } from "@/types/treatment"

export const getTreatmentRecordsByPatientId = async (patientId: number): Promise<TreatmentRecord[]> => {
  const response = await axiosInstance.get<TreatmentRecord[]>(`/treatment-records?patientId=${patientId}`)
  return response.data
}

export const deleteTreatmentRecord = async (id: number) => {
  try {
    const response = await axiosInstance.delete(`/treatment-records/${id}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi hệ thống không xác định")
  }
}

export const createTreatmentRecord = async (
  data: TreatmentFormData,
  totalAmount: number,
  updatedBy: number
) => {
  const payload = {
    appointmentId: data.appointmentID,
    dentistId: data.dentistID,
    procedureId: data.procedureID,
    consultantEmployeeID: data.consultantEmployeeID,
    toothPosition: data.toothPosition,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    treatmentToday: data.treatmentToday ?? false,
    discountAmount: data.discountAmount ?? 0,
    discountPercentage: data.discountPercentage ?? 0,
    totalAmount,
    treatmentStatus: data.treatmentStatus,
    symptoms: data.symptoms,
    diagnosis: data.diagnosis,
    treatmentDate: new Date(data.treatmentDate).toISOString(),
    updatedBy,
  }

  try {

    const response = await axiosInstance.post("/treatment-records", payload)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi hệ thống không xác định")
  }
}

export const updateTreatmentRecord = async (
  recordId: number,
  data: TreatmentFormData,
  totalAmount: number,
  updatedBy: number
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
    const response = await axiosInstance.put(`/treatment-records/${recordId}`, payload)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi hệ thống không xác định")
  }
}


export const fetchAllTreatmentRecords = async (): Promise<TreatmentRecord[]> => {
  const res = await axiosInstance.get("/treatment-records/List")
  return res.data
}

export const printDentalRecord = async (appointmentId: number): Promise<Blob> => {
  try {
    const response = await axiosInstance.get(
      `/patient/DentalRecord/Print/${appointmentId}`,
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
          'Accept': 'application/pdf',
        },
        responseType: 'blob',
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Lỗi khi in phiếu điều trị");
  }
};
