import axiosInstance from "@/lib/axios" 

export interface InstructionTemplate {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
  createdAt: string
  updatedAt?: string | null
  createByName?: string | null
  updateByName?: string | null
}

export interface CreateInstructionTemplateRequest {
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

export interface UpdateInstructionTemplateRequest {
  instruc_TemplateID: number
  instruc_TemplateName: string
  instruc_TemplateContext: string
}

const endpoint = "/instruction-templates"

export const instructionTemplateService = {
  getAll: async (): Promise<InstructionTemplate[]> => {
    try {
      const response = await axiosInstance.get(endpoint)
      return response.data || []
    } catch (error) {
      console.error('Error fetching instruction templates:', error)
      throw error
    }
  },

  create: async (data: CreateInstructionTemplateRequest): Promise<string> => {
    try {
      const response = await axiosInstance.post(endpoint, data)
      return response.data?.message || 'Tạo template thành công'
    } catch (error) {
      console.error('Error creating instruction template:', error)
      throw error
    }
  },

  update: async (data: UpdateInstructionTemplateRequest): Promise<string> => {
    try {
      const response = await axiosInstance.put(endpoint, data)
      return response.data?.message || 'Cập nhật template thành công'
    } catch (error) {
      console.error('Error updating instruction template:', error)
      throw error
    }
  },

  delete: async (id: number): Promise<string> => {
    try {
      const response = await axiosInstance.delete(`${endpoint}/${id}`)
      return response.data?.message || 'Xóa template thành công'
    } catch (error) {
      console.error('Error deleting instruction template:', error)
      throw error
    }
  },
}