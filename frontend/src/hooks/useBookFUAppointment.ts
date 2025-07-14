import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../lib/axios';

export interface CreateFUAppointmentRequest {
  patientId: number;
  dentistId: number;
  appointmentDate: string;
  appointmentTime: string;
  reasonForFollowUp: string;
  appointmentType?: string;
}

export const useBookFUAppointment = () => {
  return useMutation({
    mutationFn: async (data: CreateFUAppointmentRequest) => {
      try {
        const response = await axiosInstance.post('/appointment/FUappointment', data);
        return {
          success: true,
          message: response.data || 'Tạo lịch tái khám thành công!',
          status: response.status
        };
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.title ||
          err.message ||
          'Có lỗi xảy ra khi tạo lịch tái khám';
        throw new Error(errorMessage);
      }
    },
  });
};