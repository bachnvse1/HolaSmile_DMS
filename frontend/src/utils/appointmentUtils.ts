export const isAppointmentCancellable = (appointmentDate: string, appointmentTime: string): boolean => {
  try {
    let parsedDate: Date;
    const dateOnly = appointmentDate.split('T')[0]; 
    const timeOnly = appointmentTime.split('.')[0]; 
    
    // Method 1: ISO format
    parsedDate = new Date(`${dateOnly}T${timeOnly}`);
    
    // Method 2: manual parsing
    if (isNaN(parsedDate.getTime())) {
      const [year, month, day] = dateOnly.split('-').map(Number);
      const [hour, minute, second = 0] = timeOnly.split(':').map(Number);
      parsedDate = new Date(year, month - 1, day, hour, minute, second);
    }
    
    // Method 3: direct Date constructor
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(appointmentDate + ' ' + appointmentTime);
    }
    
    const now = new Date();
    
    if (isNaN(parsedDate.getTime())) {
      return false;
    }
    
    // Check if appointment is in the past
    if (parsedDate <= now) {
      return false;
    }
    
    // Check if less than 2 hours before appointment
    const twoHoursBeforeAppointment = new Date(parsedDate.getTime() - (2 * 60 * 60 * 1000));
    
    if (now >= twoHoursBeforeAppointment) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking appointment cancellable:', error);
    return false;
  }
};

export const getTimeUntilAppointment = (appointmentDate: string, appointmentTime: string): string => {
  try {
    let parsedDate: Date;
    
    const dateOnly = appointmentDate.split('T')[0];
    const timeOnly = appointmentTime.split('.')[0];
    
    parsedDate = new Date(`${dateOnly}T${timeOnly}`);
    
    if (isNaN(parsedDate.getTime())) {
      const [year, month, day] = dateOnly.split('-').map(Number);
      const [hour, minute, second = 0] = timeOnly.split(':').map(Number);
      parsedDate = new Date(year, month - 1, day, hour, minute, second);
    }
    
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(appointmentDate + ' ' + appointmentTime);
    }
    
    const now = new Date();
    
    if (isNaN(parsedDate.getTime())) {
      return 'Thời gian không hợp lệ';
    }
    
    const diffMs = parsedDate.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Đã qua thời gian hẹn';
    }
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours < 2) {
      if (diffHours === 0) {
        return `Còn ${remainingMinutes} phút (Không thể hủy)`;
      }
      return `Còn ${diffHours}h ${remainingMinutes}p (Không thể hủy)`;
    }
    
    if (diffHours < 24) {
      return `Còn ${diffHours}h ${remainingMinutes}p`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    const remainingHoursInDay = diffHours % 24;
    
    if (diffDays === 1) {
      return `Còn 1 ngày ${remainingHoursInDay}h`;
    }
    
    return `Còn ${diffDays} ngày ${remainingHoursInDay}h`;
  } catch (error) {
    console.error('Error calculating time until appointment:', error);
    return 'Không thể tính toán thời gian';
  }
};

