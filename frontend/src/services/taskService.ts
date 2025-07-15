import axiosInstance from "@/lib/axios"
import type { BasicTask, TaskAssignment } from "@/types/task"
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

  async updateTaskStatus(taskId: number, isCompleted: boolean): Promise<{ message: string }> {
    const res = await axiosInstance.put(`/task/tasks/${taskId}/status`, isCompleted,)
    return res.data
  },
}

export const getAllTasks = async (): Promise<BasicTask[]> => {
  const response = await axiosInstance.get("/task")
  return response.data
}
