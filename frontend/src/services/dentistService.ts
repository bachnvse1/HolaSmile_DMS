import axiosInstance from '@/lib/axios';
import type { DentistScheduleData } from '../types/appointment';

export const dentistService = {
  async getAllDentistSchedules(): Promise<DentistScheduleData[]> {
    const response = await axiosInstance.get('/Dentist/Schedule/AllDentistSchedule');
    return response.data;
  },

  async getDentistSchedule(dentistId: number): Promise<DentistScheduleData> {
    const response = await axiosInstance.get(`/Dentist/Schedule/${dentistId}`);
    return response.data;
  },

};
