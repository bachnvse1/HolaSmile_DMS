import axiosInstance from '@/lib/axios';
import type {
  PromotionProgram,
  PromotionProgramDetail,
  CreatePromotionRequest,
  UpdatePromotionRequest
} from '@/types/promotion.types';

export const promotionApi = {
  getPromotionPrograms: async (): Promise<PromotionProgram[]> => {
    try {
      const response = await axiosInstance.get('/promotion/list-promotion-programs');
      return response.data;
    } catch (error) {
      console.error('Error getting promotion programs:', error);
      throw error;
    }
  },

  getPromotionProgramDetail: async (programId: number): Promise<PromotionProgramDetail> => {
    try {
      const response = await axiosInstance.get(`/promotion/promotion-program/${programId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting promotion program detail:', error);
      throw error;
    }
  },

  createPromotionProgram: async (data: CreatePromotionRequest) => {
    try {
      const response = await axiosInstance.post('/promotion/create-discount-program', data);
      return response.data;
    } catch (error) {
      console.error('Error creating promotion program:', error);
      throw error;
    }
  },

  updatePromotionProgram: async (data: UpdatePromotionRequest) => {
    try {
      const response = await axiosInstance.put('/promotion/update-promotion-program', data);
      return response.data;
    } catch (error) {
      console.error('Error updating promotion program:', error);
      throw error;
    }
  },

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