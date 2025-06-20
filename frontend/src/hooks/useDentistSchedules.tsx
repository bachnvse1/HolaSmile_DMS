import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import type { DentistScheduleData } from '../types/appointment';

export const useDentistSchedules = () => {
  return useQuery<DentistScheduleData[]>({
    queryKey: ['dentistSchedules'],
    queryFn: async () => {
      const response = await axiosInstance.get('/api/Dentist/Schedule/AllDentistSchedule');
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

export type { DentistScheduleData } from '../types/appointment';