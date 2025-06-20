import axiosInstance from '../lib/axios';
import type { CreateAppointmentRequest } from '../types/appointment';

export const appointmentService = {
  async createAppointment(data: CreateAppointmentRequest) {
    try {
      console.log('Request payload:', data);
      
      const response = await axiosInstance.post('/api/Guest/BookAppointment', data);      
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      
      return { 
        success: true, 
        message: response.data || 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
        status: response.status
      };
    } catch (error: unknown) {
      console.error('Service error:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        // Lỗi từ server với status code
        const axiosError = error as { response: { data?: { message?: string; title?: string }; status: number; statusText: string } };
        const errorMessage = axiosError.response.data?.message || 
                            axiosError.response.data?.title || 
                            `Error ${axiosError.response.status}: ${axiosError.response.statusText}`;
        throw new Error(errorMessage);
      } else if (error && typeof error === 'object' && 'request' in error) {
        // Không nhận được response
        throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Lỗi khi thiết lập request
        const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt lịch';
        throw new Error(errorMessage);
      }
    }
  }
};