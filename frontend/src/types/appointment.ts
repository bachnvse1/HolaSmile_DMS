export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  experience: string;
  rating: number;
  schedule: DoctorSchedule;
}

export interface DoctorSchedule {
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
  doctorId: string;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
}