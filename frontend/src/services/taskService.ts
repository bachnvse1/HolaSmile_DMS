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
    const res = await axiosInstance.get("/assistant/tasks")
    return res.data.map((t: any) => ({
      ...t,
      status: t.status === "Completed" ? "Completed" : "Pending",
    }))
  },

  async getTaskById(taskId: number): Promise<Task> {
    const res = await axiosInstance.get(`/assistant/tasks/${taskId}`)
    return {
      ...res.data,
      status: res.data.status === "Completed" ? "Completed" : "Pending",
    }
  },
}
