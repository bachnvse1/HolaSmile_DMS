import axiosInstance from '../lib/axios';
import type { CreateAppointmentRequest } from '../types/appointment';

export const appointmentService = {
  async createAppointment(data: CreateAppointmentRequest) {
    try {
      
      const response = await axiosInstance.post('/Guest/BookAppointment', data);      
      
      return { 
        success: true, 
        message: response.data || 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
        status: response.status
      };
    } catch (error: unknown) {
      console.error('Service error:', error);
    }
  }
};