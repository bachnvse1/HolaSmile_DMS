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
    try {
      const res = await axiosInstance.post("/invoice/create", data);
      const payload = res.data;

      if (res.status < 200 || res.status >= 300) {
        throw new Error(`HTTP ${res.status}: ${payload?.message || "Lỗi khi tạo hóa đơn"}`);
      }

      if (payload?.success === false) {
        const err: any = new Error(payload?.message || "Lỗi khi tạo hóa đơn");
        err.response = { data: payload, status: res.status };
        throw err;
      }

      if (payload?.error) {
        throw new Error(payload.error);
      }
      return payload;

    } catch (err: any) {
      if (err.response) {
        const errorData = err.response.data;
        const errorMessage = errorData?.message || errorData?.error || err.message || "Lỗi khi tạo hóa đơn";
        throw new Error(errorMessage);
      }
      const msg = err?.message || "Lỗi khi tạo hóa đơn";
      throw new Error(msg);
    }
  },

  async updateOrderCode(orderCode: string): Promise<any> {
    const response = await axiosInstance.put("/invoice/updateOrderCode", { orderCode })
    return response.data
  },

  async createPaymentLink(orderCode: string): Promise<any> {
    const response = await axiosInstance.post("/payment/create-link", { orderCode })
    return response.data
  },

  async handlePayment(invoice: Invoice): Promise<string> {
    if (invoice.paymentUrl) {
      return invoice.paymentUrl
    }

    if (invoice.orderCode) {
      const response = await this.createPaymentLink(invoice.orderCode)
      return response.checkoutUrl
    }

    throw new Error('Không thể tạo link thanh toán: thiếu thông tin cần thiết')
  },

  async printInvoice(invoiceId: number): Promise<Blob> {
    try {
      const response = await axiosInstance.get(`/invoice/print/${invoiceId}`,
        {
          headers: {
            "ngrok-skip-browser-warning": "true",
            'Accept': 'application/pdf',
          },
          responseType: 'blob',
        }
      )
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Lỗi khi in hóa đơn");
    }
  },

  async updateInvoice(data: {
    invoiceId: number
    patientId: number
    paymentMethod: string
    transactionType: string
    status: string
    description: string
    paidAmount: number
  }): Promise<any> {
    const response = await axiosInstance.put("/invoice/update", data)
    return response.data
  }

}
