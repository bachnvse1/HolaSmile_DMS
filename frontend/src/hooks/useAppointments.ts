import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import type { AppointmentDTO } from '../types/appointment';

export const useAppointments = () => {
  return useQuery<AppointmentDTO[]>({
    queryKey: ['appointments'],
    queryFn: async () => {
      const response = await axiosInstance.get('/appointment/listappointment');
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - appointments change frequently
    retry: 2,
  });
};

export const useAppointmentsByDateRange = (startDate: string, endDate: string) => {
  return useQuery<AppointmentDTO[]>({
    queryKey: ['appointments', 'dateRange', startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get('/appointment/listappointment', {
        params: { startDate, endDate }
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });
};