import axiosInstance from "@/lib/axios"

export interface Assistant {
  assistantId: number
  fullname: string
  phone: string
}

export const getAllAssistants = async (): Promise<Assistant[]> => {
  const response = await axiosInstance.get('/assistant/view-list-assistant')
  return response.data
}
