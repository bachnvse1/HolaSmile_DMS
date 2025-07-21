import axiosInstance from "@/lib/axios" 

export interface InstructionTemplate {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
  createdAt: string
  updatedAt?: string
  createByName?: string
  updateByName?: string
}

export interface CreateInstructionTemplateRequest {
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

export interface UpdateInstructionTemplateRequest extends CreateInstructionTemplateRequest {
  instruc_TemplateID: number
}

const endpoint = "/instruction-templates"

export const instructionTemplateService = {
  getAll: async (): Promise<InstructionTemplate[]> => {
    const response = await axiosInstance.get(endpoint)
    return response.data
  },

  create: async (data: CreateInstructionTemplateRequest): Promise<string> => {
    const response = await axiosInstance.post(endpoint, data)
    return response.data.message
  },

  update: async (data: UpdateInstructionTemplateRequest): Promise<string> => {
    const response = await axiosInstance.put(endpoint, data)
    return response.data.message
  },

  delete: async (id: number): Promise<string> => {
    const response = await axiosInstance.delete(`${endpoint}/${id}`)
    return response.data.message
  },
}
