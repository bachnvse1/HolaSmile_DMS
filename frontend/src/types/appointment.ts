export interface Dentist {
  id: string;
  name: string;
  avatar: string;
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
  avatar?: string;
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

// Updated AppointmentDTO to match backend logic
export interface AppointmentDTO {
  appointmentId: number;
  patientName: string;
  dentistName: string;
  appointmentDate: string; // ISO date string
  appointmentTime: string; // HH:mm:ss format
  content: string;
  appointmentType: string;
  isNewPatient: boolean;
  status: 'confirm' | 'canceled'; // Only 2 statuses as per backend
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  // Additional fields for calendar view
  patientId?: number;
  dentistId?: number;
}

export interface AppointmentViewProps {
  viewMode: 'list' | 'calendar';
  onViewModeChange: (mode: 'list' | 'calendar') => void;
}

export interface CalendarAppointment {
  id: number;
  title: string;
  date: string;
  time: string;
  status: 'confirm' | 'canceled';
  type: string;
  isNewPatient: boolean;
  details: AppointmentDTO;
}