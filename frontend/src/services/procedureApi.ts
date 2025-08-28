import axiosInstance from '@/lib/axios';

export interface Procedure {
  procedureId: number;
  procedureName: string;
  price?: number;
  description?: string;
}

export const procedureApi = {
  // Get all procedures
  getProcedures: async (): Promise<Procedure[]> => {
    try {
      const response = await axiosInstance.get('/procedures/list-procedure');
      return response.data;
    } catch (error) {
      console.error('Error getting procedures:', error);
      throw error;
    }
  }
  ,
  // Guest-facing list (uses different backend route if backend provides it)
  getGuestProcedures: async (): Promise<Procedure[]> => {
    try {
      const response = await axiosInstance.get('/procedures/list-guest-procedure');
      return response.data;
    } catch (error) {
      console.error('Error getting guest procedures:', error);
      throw error;
    }
  }
};