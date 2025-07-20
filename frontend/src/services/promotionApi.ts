import axiosInstance from '@/lib/axios';

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

export const promotionApi = {
  // Get all promotion programs
  getPromotionPrograms: async (): Promise<PromotionProgram[]> => {
    try {
      const response = await axiosInstance.get('/promotion/list-promotion-programs');
      return response.data;
    } catch (error) {
      console.error('Error getting promotion programs:', error);
      throw error;
    }
  },

  // Get promotion program detail
  getPromotionProgramDetail: async (programId: number): Promise<PromotionProgramDetail> => {
    try {
      const response = await axiosInstance.get(`/promotion/promotion-program/${programId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting promotion program detail:', error);
      throw error;
    }
  },

  // Create promotion program
  createPromotionProgram: async (data: CreatePromotionRequest) => {
    try {
      const response = await axiosInstance.post('/promotion/create-discount-program', data);
      return response.data;
    } catch (error) {
      console.error('Error creating promotion program:', error);
      throw error;
    }
  },

  // Update promotion program
  updatePromotionProgram: async (data: UpdatePromotionRequest) => {
    try {
      const response = await axiosInstance.put('/promotion/update-promotion-program', data);
      return response.data;
    } catch (error) {
      console.error('Error updating promotion program:', error);
      throw error;
    }
  },

  // Deactivate promotion program
  deactivatePromotionProgram: async (programId: number) => {
    try {
      const response = await axiosInstance.put(`/promotion/deactive-promotion-program/${programId}`);
      return response.data;
    } catch (error) {
      console.error('Error deactivating promotion program:', error);
      throw error;
    }
  }
};