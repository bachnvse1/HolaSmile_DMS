import type { DentistSchedule, DentistScheduleData } from '../types/appointment';

export const isTimeSlotAvailable = (
  schedule: DentistSchedule,
  date: string,
  period: 'morning' | 'afternoon' | 'evening'
): boolean => {
  if (!schedule || !schedule[date]) return false;
  return schedule[date][period];
};

export const mapBackendScheduleToFrontend = (backendData: DentistScheduleData[]): {
  id: string;
  name: string;
  avatar: string;
  schedule: DentistSchedule;
  dentistID: number;
  backendSchedules: DentistScheduleData['schedules'];
}[] => {
  return backendData.map(dentist => {
    const schedule: DentistSchedule = {};
    dentist.schedules.forEach(scheduleItem => {
      const dateStr = scheduleItem.workDate.split('T')[0];
      
      if (!schedule[dateStr]) {
        schedule[dateStr] = {
          morning: false,
          afternoon: false,
          evening: false
        };
      }
      
      const shift = scheduleItem.shift.toLowerCase() as 'morning' | 'afternoon' | 'evening';      
      schedule[dateStr][shift] = true;
    });
    
    return {
      id: dentist.dentistID.toString(),
      name: dentist.dentistName,
      avatar: dentist.avatar || '',
      schedule,
      dentistID: dentist.dentistID,
      backendSchedules: dentist.schedules
    };
  });
};

export const SHIFT_TIME_MAP: Record<'morning' | 'afternoon' | 'evening', string> = {
  morning: '08:00',
  afternoon: '14:00',
  evening: '17:00',
};
