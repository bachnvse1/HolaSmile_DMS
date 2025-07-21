import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '../lib/axios';
import { getErrorMessage } from '@/utils/formatUtils';

// Original interface for authenticated users
export interface CreateAppointmentRequest {
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AppointmentDate: string; // Date string format: "2025-06-20"
  AppointmentTime: string; // TimeSpan format: "08:00:00"
  MedicalIssue: string;
  DentistId: number;
  CaptchaValue: string;
  CaptchaInput: string;
}

// New interface for Guest booking with captcha
export interface GuestBookAppointmentRequest {
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AppointmentDate: string; // ISO string
  AppointmentTime: string; // HH:mm:ss format
  MedicalIssue: string;
  DentistId: number;
  CaptchaValue: string;
  CaptchaInput: string;
}

export interface BookAppointmentResponse {
  success?: boolean;
  message?: string;
  appointmentId?: number;
  patientId?: number;
}

// Original hook for authenticated users
export const useBookAppointment = () => {
  return useMutation<BookAppointmentResponse, Error, CreateAppointmentRequest>({
    mutationFn: async (data: CreateAppointmentRequest) => {
      const response = await axiosInstance.post('/Guest/BookAppointment', data);
      return {
        success: true,
        message: response.data || 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
        status: response.status
      };
    },
    onError: (error) => {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi đặt lịch hẹn');
    }
  });
};

// New hook for Guest booking with captcha
export const useGuestBookAppointment = () => {
  return useMutation<BookAppointmentResponse, Error, GuestBookAppointmentRequest>({
    mutationFn: async (requestData: GuestBookAppointmentRequest) => {
      const response = await axiosInstance.post('/Guest/BookAppointment', requestData);
      return response.data;
    },
    onError: (err) => {
      toast.error(getErrorMessage(err) || 'Có lỗi xảy ra khi đặt lịch hẹn');
    }
  });
};