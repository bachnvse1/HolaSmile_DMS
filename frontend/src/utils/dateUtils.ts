import { format, addDays, startOfWeek, endOfWeek, parseISO, isValid, isBefore, isAfter, addMonths, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ShiftType } from '../types/schedule';

// Format date theo định dạng tiếng Việt
export const formatDate = (date: Date | string, formatStr = 'dd/MM/yyyy'): string => {
  if (typeof date === 'string') {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return 'Invalid date';
    date = parsedDate;
  }
  return format(date, formatStr, { locale: vi });
};

// Format date với tên thứ
export const formatDateWithDay = (input: string | Date): string => {
  let date: Date | null = null;

  if (!input) return "Không xác định";

  if (typeof input === "string") {
    // Thử parse theo ISO trước, nếu fail thì parse dd/MM/yyyy
    date = parseISO(input);
    if (!isValid(date)) {
      date = parse(input, "dd/MM/yyyy", new Date());
    }
  } else {
    date = input;
  }

  if (!date || isNaN(date.getTime())) return "Không xác định";

  return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
};

// Lấy ngày đầu tiên của tuần
export const getWeekStart = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Tuần bắt đầu từ thứ 2
};

// Lấy ngày cuối cùng của tuần
export const getWeekEnd = (date: Date = new Date()): Date => {
  return endOfWeek(date, { weekStartsOn: 1 }); // Tuần kết thúc vào chủ nhật
};

// Lấy mảng các ngày trong tuần
export const getDaysInWeek = (date: Date = new Date()): Date[] => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

// Chuyển đổi ShiftType sang text hiển thị
export const shiftTypeToText = (shift: ShiftType): string => {
  switch (shift) {
    case ShiftType.Morning:
      return 'Sáng (8:00 - 11:00)';
    case ShiftType.Afternoon:
      return 'Chiều (14:00 - 17:00)';
    case ShiftType.Evening:
      return 'Tối (17:00 - 20:00)';
    default:
      return 'Không xác định';
  }
};

// Kiểm tra xem ngày có phải là quá khứ không
export const isPastDate = (date: Date | string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (typeof date === 'string') {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    date = parsedDate;
  }
  
  return isBefore(date, today);
};

// Kiểm tra xem ngày có trong tương lai xa không (> 3 tháng)
export const isFarFutureDate = (date: Date | string): boolean => {
  const threeMonthsLater = addMonths(new Date(), 3);
  
  if (typeof date === 'string') {
    const parsedDate = parseISO(date);
    if (!isValid(parsedDate)) return false;
    date = parsedDate;
  }
  
  return isAfter(date, threeMonthsLater);
};

// Format date sang định dạng yyyy-MM-dd cho API
export const formatDateForApi = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Hàm parse ngày theo local để tránh lệch múi giờ khi render lịch
export function parseLocalDate(dateString: string) {
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour = 0, minute = 0, second = 0] = (timePart || '00:00:00').split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}