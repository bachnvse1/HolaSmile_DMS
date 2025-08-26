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

const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return dateString;
  
  if (dateString.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)) {
    return dateString;
  }
  
  try {
    let dateToFormat: Date;
    
    if (dateString.includes('T')) {
      const cleanDateString = dateString.replace(/Z.*$/, '').replace(/[+-]\d{2}:?\d{2}$/, '');
      const [datePart, timePart] = cleanDateString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
      
      dateToFormat = new Date(year, month - 1, day, hours, minutes, seconds);
    } else {
      dateToFormat = new Date(dateString);
    }
    
    if (isNaN(dateToFormat.getTime())) {
      console.warn("Invalid date, returning original string:", dateString);
      return dateString;
    }
    
    const year = dateToFormat.getFullYear();
    const month = String(dateToFormat.getMonth() + 1).padStart(2, '0');
    const day = String(dateToFormat.getDate()).padStart(2, '0');
    const hours = String(dateToFormat.getHours()).padStart(2, '0');
    const minutes = String(dateToFormat.getMinutes()).padStart(2, '0');
    const seconds = String(dateToFormat.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error("Error formatting date for backend:", error);
    return dateString;
  }
};

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
    treatmentDate: formatDateForBackend(data.treatmentDate),
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
    dentistId : data.dentistID,
    procedureId: data.procedureID,
    toothPosition: data.toothPosition,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    discountPercentage: data.discountPercentage,
    discountAmount: data.discountAmount,
    totalAmount,
    treatmentStatus: data.treatmentStatus,
    symptoms: data.symptoms,
    diagnosis: data.diagnosis,
    treatmentDate: formatDateForBackend(data.treatmentDate),
    updatedBy,
  }

  try {
    console.log("Updating with treatmentDate:", payload.treatmentDate); // Debug log
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