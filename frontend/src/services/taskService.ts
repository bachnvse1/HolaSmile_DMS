import axiosInstance from "@/lib/axios"
import type { TaskAssignment } from "@/types/task"

export const assignTaskApi = async (data: TaskAssignment) => {
  try {
    const response = await axiosInstance.post("/task/assign-task", data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Không thể phân công nhiệm vụ.")
  }
}
