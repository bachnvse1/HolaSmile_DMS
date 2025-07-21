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
};