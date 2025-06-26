export const getDayName = (date: Date): string => {
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[date.getDay()];
};

export const getShortDayName = (date: Date): string => {
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  return days[date.getDay()];
};

export const formatDate = (date: Date): string => {
  return `${date.getDate()}/${date.getMonth() + 1}`;
};

export const getDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const getDatesForWeek = (weekOffset: number, startDay: number = 0): Date[] => {
  const dates = [];
  const today = new Date();
  const start = weekOffset * 7 + startDay;
  
  for (let i = start; i < start + 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  
  return dates;
};

export const getWeekDateRange = (dates: Date[]): string => {
  if (dates.length === 0) return '';
  
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;

};

export const formatVietnameseDateFull = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export const formatVietnameseDateWithDay = (date: Date): string => {
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric"
  });
};