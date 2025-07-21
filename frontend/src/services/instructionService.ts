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

export interface InstructionTemplateDTO {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

export const getPatientInstructions = async (appointmentId: number): Promise<InstructionDTO[]> => {
  const response = await axiosInstance.get(`/instruction/patient/list?appointmentId=${appointmentId}`)
  return response.data
}

export const createInstruction = async (
  appointmentId: number,
  content: string,
  templateId: number
): Promise<void> => {
  await axiosInstance.post("/instruction/create", {
    appointmentId,
    content,
    instruc_TemplateID: templateId,
  })
}

export const editInstruction = async (
  instructionId: number,
  content: string,
  templateId: number
): Promise<void> => {
  await axiosInstance.put("/instruction/update", {
    instructionId,
    content,
    instruc_TemplateID: templateId,
  })
}

export const deactivateInstruction = async (instructionId: number): Promise<void> => {
  await axiosInstance.put("/instruction/deactive", {
    instructionId
  })
}
