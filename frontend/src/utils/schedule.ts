import type { DentistSchedule } from '../types/appointment';

export const generateDentistSchedule = (): DentistSchedule => {
  const schedule: DentistSchedule = {};
  const today = new Date();
  
  // Chỉ tạo lịch cho 14 ngày
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    
    schedule[dateString] = {
      morning: Math.random() > 0.3,
      afternoon: Math.random() > 0.3,
      evening: Math.random() > 0.5,
    };
  }
  
  return schedule;
};

export const isTimeSlotAvailable = (
  schedule: DentistSchedule,
  date: string,
  period: 'morning' | 'afternoon' | 'evening'
): boolean => {
  return schedule[date]?.[period] || false;
};