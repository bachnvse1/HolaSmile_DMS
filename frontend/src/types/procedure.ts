export interface Supply {
  supplyId: number
  quantity: number
  supplyName?: string
}

export interface SupplyItem {
  id: number
  name: string
  unit: string
  price: number
  inStock: number
  createdAt: string | null
}

export interface ExtendedSupply extends Supply {
  supplyName: string
  unit: string
  price: number
}

export interface Procedure {
  procedureId: number
  procedureName: string
  price: number
  description: string
  originalPrice: number
  consumableCost: number
  createdAt: string
  updatedAt: string | null
  createdBy: string | null
  updatedBy: string | null
  duration?: number
  requirements?: string
  isDeleted?: boolean
  discount?: number
  suppliesUsed?: Supply[]
  calculatedSupplyCost?: number
}

export interface ProcedureCreateForm {
  procedureName: string
  price: number
  description: string
  originalPrice: number
  consumableCost: number
  suppliesUsed: Supply[]
  calculatedSupplyCost?: number
}

export interface ProcedureUpdateForm {
  procedureId: number
  procedureName: string
  price: number
  description: string
  originalPrice: number
  consumableCost: number
  suppliesUsed?: Supply[]
  calculatedSupplyCost?: number
}