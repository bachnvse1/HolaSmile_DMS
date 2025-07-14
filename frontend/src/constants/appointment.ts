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
    timeRange: '14:00 - 17:00'
  },
  { 
    label: 'Ca Tối', 
    period: 'evening' as const, 
    timeRange: '17:00 - 20:00'
  },
] as const;

export type TimeSlotPeriod = typeof TIME_SLOTS[number]['period'];
