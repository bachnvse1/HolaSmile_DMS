import { useMemo } from 'react';
import { useDentistSchedules } from './useDentistSchedules';
import { convertDentistSchedule } from '../utils/convertDentistSchedule';
import type { Dentist } from '../types/appointment';

/**
 * Hook tùy chỉnh để lấy và chuyển đổi dữ liệu lịch bác sĩ
 * Cung cấp dữ liệu đã được chuyển đổi phù hợp cho component lịch
 */
export const useDentistSchedule = (): {
  dentists: Dentist[];
  isLoading: boolean;
  error: unknown;
} => {
  // Lấy dữ liệu từ API
  const { data: backendData, isLoading, error } = useDentistSchedules();
  
  // Chuyển đổi dữ liệu từ backend sang định dạng frontend
  const dentists = useMemo(() => {
    try {
      // Kiểm tra và log để debug
      console.log('Raw backend data:', backendData);
      
      if (!backendData) {
        return [];
      }
      
      // Sử dụng hàm chuyển đổi để tạo ra dữ liệu cho frontend
      return convertDentistSchedule(backendData);
    } catch (err) {
      console.error('Error converting dentist schedules:', err);
      return [];
    }
  }, [backendData]);
  
  return { dentists, isLoading, error };
};