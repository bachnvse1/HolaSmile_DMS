import type { DentistScheduleData } from '../types/appointment';

export const dentistService = {
  async getAllDentistSchedules(): Promise<DentistScheduleData[]> {
    const response = await fetch('http://localhost:5135/api/Dentist/Schedule/AllDentistSchedule');
    
    if (!response.ok) {
      throw new Error('Failed to fetch dentist schedules');
    }
    
    return response.json();
  },

  async getDentistSchedule(dentistId: number) {
    const response = await fetch(`/Dentist/Schedule/${dentistId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dentist schedule');
    }
    
    return response.json();
  },

  async getDentistProfile(dentistId: number) {
    const response = await fetch(`/Dentist/${dentistId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch dentist profile');
    }
    
    return response.json();
  }
};