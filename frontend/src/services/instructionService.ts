import axiosInstance from "@/lib/axios"

export interface InstructionDTO {
  instructionId: number
  appointmentId: number
  content: string
  createdAt: string
  dentistName: string
  instruc_TemplateID?: number | null
  instruc_TemplateName?: string | null
  instruc_TemplateContext?: string | null
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
  templateId?: number | null
): Promise<void> => {
  const payload: any = {
    appointmentId,
    content
  }
  
  if (templateId) {
    payload.instruc_TemplateID = templateId
  }
  
  await axiosInstance.post("/instruction/create", payload)
}

export const editInstruction = async (
  instructionId: number,
  content: string,
  templateId?: number | null
): Promise<void> => {
  const payload: any = {
    instructionId,
    content
  }
  
  if (templateId) {
    payload.instruc_TemplateID = templateId
  }
  
  await axiosInstance.put("/instruction/update", payload)
}

export const deactivateInstruction = async (instructionId: number): Promise<void> => {
  await axiosInstance.put("/instruction/deactive", {
    instructionId
  })
}

export { instructionTemplateService } from './instructionTemplateService'