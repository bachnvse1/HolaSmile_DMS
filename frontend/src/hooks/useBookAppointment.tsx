import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';
import type { CreateAppointmentRequest } from '../types/appointment';

export const useBookAppointment = () => {
  return useMutation({
    mutationFn: async (data: CreateAppointmentRequest) => {
      const response = await axiosInstance.post('/api/Guest/BookAppointment', data);
      return {
        success: true,
        message: response.data || 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
        status: response.status
      };
    },
  });
};