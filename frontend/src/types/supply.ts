export interface Supply {
  SupplyID: number;
  Name: string;
  Unit: string;
  QuantityInStock?: number; 
  ExpiryDate?: string; 
  Price: number;
  CreatedAt: string;
  UpdatedAt: string;
  CreatedBy: number;
  UpdatedBy: number;
  IsDeleted: boolean;
  isDeleted?: boolean; 
}

export interface CreateSupplyRequest {
  supplyName: string;
  unit: string;
  price: number;
}

export interface UpdateSupplyRequest {
  supplyId: number;
  supplyName: string;
  unit: string;
  price: number;
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
}