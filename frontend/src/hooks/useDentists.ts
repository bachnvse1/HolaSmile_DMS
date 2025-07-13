import { useQuery } from '@tanstack/react-query';
import axiosInstance from '@/lib/axios';

export interface Dentist {
  dentistId: number;
  fullName: string;
}

export const useDentists = () => {
  return useQuery({
    queryKey: ['dentists'],
    queryFn: async (): Promise<Dentist[]> => {
      const response = await axiosInstance.get('/dentist/getAllDentistsName');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, 
  });
};