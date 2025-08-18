import type { DentistScheduleData } from '../hooks/useDentistSchedules';

export type DentistSchedule = {
  [date: string]: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
};

export function convertDentistSchedule(schedules: DentistScheduleData['schedules']): DentistSchedule {
  const result: DentistSchedule = {};
  
interface ScheduleItem {
    workDate: string;
    shift: 'Morning' | 'Afternoon' | 'Evening';
    status: string;
    scheduleId: number;
}

schedules.forEach((item: ScheduleItem) => {
    const date: string = item.workDate.split('T')[0]; 
    
    if (!result[date]) {
        result[date] = { morning: false, afternoon: false, evening: false };
    }
    
    if (item.status === 'free') {
        if (item.shift === 'Morning') result[date].morning = true;
        if (item.shift === 'Afternoon') result[date].afternoon = true;  
        if (item.shift === 'Evening') result[date].evening = true;
    }
});
  
  return result;
}

export function getScheduleId(
  schedules: DentistScheduleData['schedules'], 
  date: string, 
  shift: 'morning' | 'afternoon' | 'evening'
): number | null {
  const shiftMap = {
    morning: 'Morning',
    afternoon: 'Afternoon', 
    evening: 'Evening'
  };
  
  const schedule = schedules.find(s => 
    s.workDate.split('T')[0] === date && 
    s.shift === shiftMap[shift] &&
    s.status === 'free'
  );
  
  return schedule?.scheduleId || null;
}