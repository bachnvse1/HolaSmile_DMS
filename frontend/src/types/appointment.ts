export interface Dentist {
  id: string;
  name: string;
  avatar: string;
  schedule: DentistSchedule;
  dentistID: number; 
  backendSchedules?: DentistScheduleData['schedules']; 
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
  backendDentistId: number; 
}

export interface DentistScheduleData {
  dentistID: number;
  dentistName: string;
  avatar?: string | null;
  schedules: {
    scheduleId: number;
    dentistName: string | null;
    workDate: string;  
    shift: string;     // "morning" | "afternoon" | "evening"
    createdAt: string;
    updatedAt: string | null;
  }[];
  isAvailable: boolean;
}

export interface CreateAppointmentRequest {
  FullName: string;
  Email: string;
  PhoneNumber: string;
  AppointmentDate: string; 
  AppointmentTime: string; 
  MedicalIssue: string;
  DentistId: number;
}

export interface BookAppointmentRequestWrapper {
  request: CreateAppointmentRequest;
}

export interface BookAppointmentResponse {
  success?: boolean;
  message?: string;
  appointmentId?: number;
  patientId?: number;
}

export interface AppointmentDTO {
  appointmentId: number;
  patientName: string;
  dentistName: string;
  appointmentDate: string; 
  appointmentTime: string; 
  content: string;
  appointmentType: string;
  isNewPatient: boolean;
  status: 'confirmed' | 'canceled' | 'attended' | 'absented'; 
  createdAt: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
  patientId?: number;
  dentistId?: number;
  isExistPrescription: boolean;
  isExistInstruction: boolean;
  prescriptionId: number | null;
  instructionId: number | null;
  cancelReason: string | null;
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
  status: 'confirmed' | 'canceled' | 'attended' | 'absented' ;
  type: string;
  isNewPatient: boolean;
  details: AppointmentDTO;
}