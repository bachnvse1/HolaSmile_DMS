import axiosInstance from "@/lib/axios"
import type { TaskAssignment } from "@/types/task"
import type { Task } from "@/types/task"

export const assignTaskApi = async (data: TaskAssignment) => {
  try {
    const response = await axiosInstance.post("/task/assign-task", data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Không thể phân công nhiệm vụ.")
  }
}

export const taskService = {
  async getAssignedTasks(): Promise<Task[]> {
    const response = await axiosInstance.get("/assistant/tasks")
    const rawTasks = response.data
    
    return rawTasks.map((t: any) => ({
      ...t,
      status: t.status === "Completed" ? "Completed" : "Pending",
    }))
  },
}
