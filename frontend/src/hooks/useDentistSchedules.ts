import { useQuery } from '@tanstack/react-query';
import type { DentistScheduleData } from '../types/appointment';
import axiosInstance from '../lib/axios';
// Hook lấy dữ liệu lịch từ API
export const useDentistSchedules = () => {
  return useQuery<DentistScheduleData[]>({
    queryKey: ['dentistSchedules'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/schedule/dentist/available');
        return response.data;
      } catch (error) {
        console.error('Error fetching dentist schedules:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0.5 * 60 * 1000, 
  });
};

export type { DentistScheduleData } from '../types/appointment';