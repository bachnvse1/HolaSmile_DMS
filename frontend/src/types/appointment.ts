export interface Dentist {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  experience: string;
  rating: number;
  schedule: DentistSchedule;
  dentistID: number; // Thêm để mapping với backend
  backendSchedules?: DentistScheduleData['schedules']; // Lưu lại để lấy scheduleId
}

export interface DentistSchedule {
  [date: string]: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

export interface TimeSlotBase {
  label: string;
  period: 'morning' | 'afternoon' | 'evening';
  timeRange: string;
}

export interface TimeSlot extends TimeSlotBase {
  icon: React.ReactNode;
}

export interface AppointmentFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  medicalIssue: string;
}

export interface AppointmentData extends AppointmentFormData {
  dentistId: string;
  dentistName: string;
  appointmentDate: string;
  timeSlot: string;
  backendDentistId: number; // Thêm để gửi lên backend
}

// Backend types
export interface DentistScheduleData {
  dentistID: number;
  dentistName: string;
  schedules: {
    scheduleId: number;
    workDate: string;
    shift: 'Morning' | 'Afternoon' | 'Evening';
    status: 'active' | 'free' | string;
  }[];
  isAvailable: boolean;
}

export interface CreateAppointmentRequest {
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AppointmentDate: string; // Date string format: "2025-06-20"
  AppointmentTime: string; // TimeSpan format: "08:00:00"
  MedicalIssue: string;
  DentistId: number;
}

// Wrapper cho backend request
export interface BookAppointmentRequestWrapper {
  request: CreateAppointmentRequest;
}

export interface BookAppointmentResponse {
  success?: boolean;
  message?: string;
  appointmentId?: number;
  patientId?: number;
}