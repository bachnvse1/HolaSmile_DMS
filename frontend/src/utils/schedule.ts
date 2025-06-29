import type { DentistSchedule, DentistScheduleData } from '../types/appointment';

// Kiểm tra xem một time slot có khả dụng hay không
export const isTimeSlotAvailable = (
  schedule: DentistSchedule,
  date: string,
  period: 'morning' | 'afternoon' | 'evening'
): boolean => {
  if (!schedule || !schedule[date]) return false;
  return schedule[date][period];
};

// Chuyển đổi từ dữ liệu API sang định dạng frontend sử dụng
export const mapBackendScheduleToFrontend = (backendData: DentistScheduleData[]): {
  id: string;
  name: string;
  avatar: string;
  schedule: DentistSchedule;
  dentistID: number;
  backendSchedules: DentistScheduleData['schedules'];
}[] => {
  return backendData.map(dentist => {
    // Khởi tạo lịch trống
    const schedule: DentistSchedule = {};
      // Xử lý từng lịch làm việc của bác sĩ
    dentist.schedules.forEach(scheduleItem => {
      // Lấy ngày từ chuỗi ISO (YYYY-MM-DD)
      const dateStr = scheduleItem.workDate.split('T')[0];
      
      // Khởi tạo ngày nếu chưa có
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
