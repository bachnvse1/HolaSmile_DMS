import type { Doctor } from '../types/appointment';
import doc1 from '@/assets/doc1.jpg';
// Time slots constants
export const TIME_SLOTS = [
  { 
    label: 'Ca Sáng', 
    period: 'morning' as const, 
    timeRange: '8:00 - 11:00'
  },
  { 
    label: 'Ca Chiều', 
    period: 'afternoon' as const, 
    timeRange: '13:00 - 17:00'
  },
  { 
    label: 'Ca Tối', 
    period: 'evening' as const, 
    timeRange: '18:00 - 20:00'
  },
] as const;

export type TimeSlotPeriod = typeof TIME_SLOTS[number]['period'];

// Doctors data without schedule (will be generated)
export const DOCTORS_BASE: Omit<Doctor, 'schedule'>[] = [
  {
    id: '1',
    name: 'BS. Nguyễn Minh Tuấn',
    avatar: doc1,
    specialty: 'Nha khoa thẩm mỹ',
    experience: '15+ năm',
    rating: 4.9
  },
  {
    id: '2',
    name: 'BS. Trần Thị Hương',
    avatar: doc1,
    specialty: 'Phẫu thuật răng miệng',
    experience: '12+ năm',
    rating: 4.8
  },
  {
    id: '3',
    name: 'BS. Lê Văn Nam',
    avatar: doc1,
    specialty: 'Nha khoa trẻ em',
    experience: '10+ năm',
    rating: 4.9
  },
  {
    id: '4',
    name: 'BS. Phạm Thị Lan',
    avatar: doc1,
    specialty: 'Chỉnh nha',
    experience: '8+ năm',
    rating: 4.7
  }
];