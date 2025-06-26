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
  scheduleId?: number; // Thêm để map với backend
  dentistId: number;
  dentistName?: string;
  date: string;
  workDate?: string; // Thêm để map với backend
  shift: ShiftType;
  status: ScheduleStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean; // Thêm field isActive
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