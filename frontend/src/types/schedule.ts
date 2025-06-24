// Định nghĩa các kiểu dữ liệu cho lịch làm việc

// Enum cho status của lịch làm việc
export enum ScheduleStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected'
}

// Enum cho ca làm việc
export enum ShiftType {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Evening = 'evening'
}

// Interface cho một lịch làm việc
export interface Schedule {
  id?: number;
  dentistId: number;
  dentistName?: string;
  date: string;
  shift: ShiftType;
  status: ScheduleStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Interface cho request phê duyệt
export interface ApprovalRequest {
  scheduleIds: number[];
  action: 'approve' | 'reject';
}

// Interface cho filter lịch làm việc
export interface ScheduleFilter {
  dentistId?: number;
  startDate?: string;
  endDate?: string;
  status?: ScheduleStatus;
  shift?: ShiftType;
}