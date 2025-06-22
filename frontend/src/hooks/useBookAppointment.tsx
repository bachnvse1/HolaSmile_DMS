import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '../lib/axios';
import type { CreateAppointmentRequest } from '../types/appointment';
import type { AxiosError } from 'axios';
export const useBookAppointment = () => {
  return useMutation({
    mutationFn: async (data: CreateAppointmentRequest) => {
      try {
        const response = await axiosInstance.post('/Guest/BookAppointment', data);
        return {
          success: true,
          message: response.data || 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
          status: response.status
        };
      } catch (err) {
        const error = err as AxiosError<{ message?: string; title?: string }>;
        const errorMessage = error.response?.data?.message ||
          error.response?.data?.title ||
          error.message ||
          'Có lỗi xảy ra khi đặt lịch';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
  });
};