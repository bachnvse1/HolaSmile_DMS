import axiosInstance from "@/lib/axios"
import type { Invoice, NewInvoice } from "@/types/invoice"

export const invoiceService = {
  async getInvoices(params: {
    status?: string
    fromDate?: string
    toDate?: string
    patientId?: string | number
  }): Promise<Invoice[]> {
    const response = await axiosInstance.get("/invoice/view-list", { params })
    return response.data
  },

  async getInvoiceDetail(id: number): Promise<Invoice> {
    const response = await axiosInstance.get(`/invoice/view-detail/${id}`)
    return response.data
  },

  async createInvoice(data: NewInvoice): Promise<any> {
    const response = await axiosInstance.post("/invoice/create", data)
    return response.data
  }
}