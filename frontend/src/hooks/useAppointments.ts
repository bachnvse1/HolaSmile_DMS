import { useQuery, useMutation } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import type { AppointmentDTO } from '../types/appointment';
import { useAuth } from './useAuth';

export const useAppointments = () => {
  const { userId } = useAuth();
  
  return useQuery<AppointmentDTO[]>({
    queryKey: ['appointments', userId],
    queryFn: async () => {
      const response = await axiosInstance.get('/appointment/listAppointment');
      return response.data;
    },
    enabled: !!userId, 
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000, // 2 minutes - appointments change frequently
    retry: 2,
  });
};

export const useAppointmentsByDateRange = (startDate: string, endDate: string) => {
  return useQuery<AppointmentDTO[]>({
    queryKey: ['appointments', 'dateRange', startDate, endDate],
    queryFn: async () => {
      const response = await axiosInstance.get('/appointment/listAppointment', {
        params: { startDate, endDate }
      });
      return response.data;
    },
    enabled: !!startDate && !!endDate,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });
};

// Hook for getting single appointment detail
export const useAppointmentDetail = (appointmentId: number) => {
  return useQuery<AppointmentDTO>({
    queryKey: ['appointments', 'detail', appointmentId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/appointment/${appointmentId}`);
      return response.data;
    },
    enabled: !!appointmentId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Change appointment status
export const useChangeAppointmentStatus = () => {
  return useMutation({
    mutationFn: async (data: { appointmentId: number; status: string }) => {
      const response = await axiosInstance.put(`/appointment/changeStatus`, data);
      return response.data;
    },
    onError: (error) => {
      console.error('Change appointment status error:', error);
    }
  });
};