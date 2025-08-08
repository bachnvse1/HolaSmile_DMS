export interface PromotionProgram {
  discountProgramID: number;
  discountProgramName: string;
  createDate: string;
  endDate: string;
  createAt: string;
  updatedAt: string | null;
  createdBy: number;
  updatedBy: number | null;
  isDelete: boolean;
}

export interface PromotionProgramDetail {
  programId: number;
  programName: string;
  startDate: string;
  endDate: string;
  createAt: string;
  updateAt: string | null;
  createBy: string;
  updateBy: string;
  isDelete: boolean;
  listProcedure: ProcedureDiscount[];
}

export interface ProcedureDiscount {
  procedureId: number;
  procedureName: string;
  discountAmount: number;
}

export interface CreatePromotionRequest {
  programName: string;
  createDate: string;
  endDate: string;
  listProcedure: {
    procedureId: number;
    discountAmount: number;
  }[];
}

export interface UpdatePromotionRequest {
  programId: number;
  programName: string;
  startDate: string;
  endDate: string;
  discountPercentage: number;
  listProcedure: {
    procedureId: number;
    discountAmount: number;
  }[];
}