import axiosInstance from "@/lib/axios"
import type { CreateWarrantyCard, EditWarrantyCard, WarrantyCard } from "@/types/warranty"

// GET: Lấy danh sách thẻ bảo hành
export const fetchWarrantyCards = async (): Promise<WarrantyCard[]> => {
  const res = await axiosInstance.get("/warranty-cards")
  return res.data
}

// POST: Tạo thẻ bảo hành mới
export const createWarrantyCard = async (data: CreateWarrantyCard): Promise<{ message: string }> => {
  const res = await axiosInstance.post("/warranty-cards/create", data)
  return res.data
}

// PUT: Chỉnh sửa thẻ bảo hành
export const updateWarrantyCard = async (data: EditWarrantyCard): Promise<{ message: string }> => {
  const res = await axiosInstance.put("/warranty-cards/edit", data)
  return res.data
}

// PUT: Vô hiệu hóa thẻ bảo hành
export const deactivateWarrantyCard = async (warrantyCardId: number): Promise<{ message: string }> => {
  const res = await axiosInstance.put("/warranty-cards/deactivate", { warrantyCardId })
  return res.data
}
