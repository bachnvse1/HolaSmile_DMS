import axiosInstance from "@/lib/axios";
import type { Procedure, ProcedureCreateForm, ProcedureUpdateForm } from "@/types/procedure"

export const ProcedureService = {
  async getAll(): Promise<Procedure[]> {
    const response = await axiosInstance.get("/procedures/list-procedure")
    return response.data
  },

  async getById(id: number): Promise<Procedure> {
    const response = await axiosInstance.get(`/procedures/detail-procedure/${id}`)
    return response.data
  },

  async create(data: ProcedureCreateForm): Promise<{ data: Procedure; message: string }> {
    const response = await axiosInstance.post("/procedures/create-procedure", data)
    return response.data
  },

  async update(data: ProcedureUpdateForm): Promise<{ data: Procedure; message: string }> {
    const cleaned = {
      ...data,
      suppliesUsed: data.suppliesUsed?.map(s => ({
        supplyId: s.supplyId,
        quantity: s.quantity
      }))
    }
    const response = await axiosInstance.put("/procedures/update-procedure", cleaned)
    return response.data
  },

  async toggleActive(id: number): Promise<{ message: string }> {
    const response = await axiosInstance.put(`/procedures/active-deactive-procedure/${id}`)
    return response.data
  },
}
