import axiosInstance from "@/lib/axios"

// Tạo mới bảo trì
export const createMaintenance = async (data: {
  maintenanceDate: string
  description: string
  status: string
  supplyIds: number[]
}) => {
  const res = await axiosInstance.post("/Maintenance/create", data)
  return res.data
}

// Lấy danh sách bảo trì
export const getMaintenanceList = async () => {
  const res = await axiosInstance.get("/Maintenance/view")
  return res.data
}

// Lấy chi tiết bảo trì
export const getMaintenanceDetails = async (maintenanceId: number) => {
  const res = await axiosInstance.get(`/Maintenance/details/${maintenanceId}`)
  return res.data
}

// Tạo giao dịch cho bảo trì
export const createMaintenanceTransaction = async (data: {
  maintenanceId: number
  price: number
}) => {
  const res = await axiosInstance.post("/Maintenance/create-transaction", data)
  return res.data
}

// Xóa bảo trì
export const deleteMaintenance = async (maintenanceId: number) => {
  const res = await axiosInstance.delete(`/Maintenance/${maintenanceId}`)
  return res.data
}

// Cập nhật trạng thái bảo trì
export const updateMaintenanceStatus = async (maintenanceId: number) => {
  const res = await axiosInstance.put("/Maintenance/update-status", { maintenanceId })
  return res.data
}
