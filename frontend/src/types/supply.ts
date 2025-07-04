export interface Supply {
  SupplyId: number;
  Name: string;
  Unit: string;
  QuantityInStock: number;
  ExpiryDate: string;
  Price: number;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: number;
  UpdatedBy: number;
  IsDeleted: boolean;
}

export interface CreateSupplyRequest {
  Name: string;
  Unit: string;
  QuantityInStock: number;
  ExpiryDate: string;
  Price: number;
}

export interface UpdateSupplyRequest extends CreateSupplyRequest {
  SupplyId: number;
}

export enum SupplyUnit {
  PIECE = 'Cái',
  BOX = 'Hộp',
  BOTTLE = 'Chai',
  TUBE = 'Tuýp',
  PACK = 'Gói',
  SET = 'Bộ',
  ROLL = 'Cuộn',
  BAG = 'Túi',
  KG = 'Kg',
  GRAM = 'Gram',
  LITER = 'Lít',
  ML = 'ML'
}