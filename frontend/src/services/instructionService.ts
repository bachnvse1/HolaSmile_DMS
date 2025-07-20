import axiosInstance from "@/lib/axios"

export interface InstructionDTO {
  instructionId: number
  appointmentId: number
  content: string
  createdAt: string
  dentistName: string
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

export const getPatientInstructions = async (appointmentId: number): Promise<InstructionDTO[]> => {
  const response = await axiosInstance.get(`/instruction/patient/list?appointmentId=${appointmentId}`)
  return response.data
}