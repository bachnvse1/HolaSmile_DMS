export interface Supply {
  supplyId: number
  quantity: number
  supplyName?: string // Thêm tên vật tư để hiển thị
}

export interface SupplyItem {
  id: number
  name: string
  unit: string
  price: number
  inStock: number
}

export interface Procedure {
  procedureId: number
  procedureName: string
  price: number
  description: string
  discount: number
  originalPrice: number
  consumableCost: number
  createdAt: string
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  duration?: number
  requirements?: string
  isDeleted?: boolean
  suppliesUsed?: Supply[]
}

export interface ProcedureCreateForm {
  procedureName: string
  price: number
  description: string
  discount: number
  originalPrice: number
  consumableCost: number
  suppliesUsed: Supply[]
}

export interface ProcedureUpdateForm {
  procedureId: number
  procedureName: string
  price: number
  description: string
  discount: number
  originalPrice: number
  consumableCost: number
  suppliesUsed?: Supply[]
}
