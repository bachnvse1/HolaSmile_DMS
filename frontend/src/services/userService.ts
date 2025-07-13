import axiosInstance from "@/lib/axios" 
import type { User, CreateUserForm } from "../types/user"

const USER_ENDPOINT = "/administrator"

export const userService = {
  async getAll(): Promise<User[]> {
    const res = await axiosInstance.get(`${USER_ENDPOINT}/view-list-user`)
    return res.data
  },

  async create(data: CreateUserForm): Promise<void> {
    await axiosInstance.post(`${USER_ENDPOINT}/create-user`, data)
  },

  async toggleStatus(userId: string | number): Promise<void> {
    await axiosInstance.put(`${USER_ENDPOINT}/ban-unban-user`, { userId })
  },
}
