import React, { useState } from 'react';
import { addDays, format, startOfWeek, addWeeks } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShiftType, ScheduleStatus } from '@/types/schedule';
import type { Schedule } from '@/types/schedule';
import { cn } from '@/lib/utils';
import { isPastDate } from '@/utils/dateUtils';

interface ScheduleCalendarProps {
  schedules: Schedule[];
  onDateSelect?: (date: string, shift: ShiftType) => void;
  onSlotSelect?: (date: string, shift: ShiftType) => void;
  selectedDate?: string;
  selectedShift?: string;
  selectedSlots?: Array<{date: string, shift: ShiftType}>;
  currentWeek?: number;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  canAddSchedule?: boolean;
  disablePastDates?: boolean;
  isMultiSelectMode?: boolean;
  showDentistInfo?: boolean;
  viewMode?: boolean; 
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  schedules = [],
  onDateSelect,
  onSlotSelect,
  selectedDate = '',
  selectedShift = '',
  selectedSlots = [],
  currentWeek = 0,
  onPreviousWeek,
  onNextWeek,
  canAddSchedule = false,
  disablePastDates = true,
  isMultiSelectMode = false,
  showDentistInfo = false,
  viewMode = false
}) => {
  const [weekOffset, setWeekOffset] = useState(currentWeek);
  
  const getStartOfWeek = (offset = 0) => {
    const now = new Date();
    const startDay = startOfWeek(now, { weekStartsOn: 1 });
    return addWeeks(startDay, offset);
  };
  
  const getDaysOfWeek = (startDay: Date) => {
    return Array.from({ length: 7 }, (_, i) => addDays(startDay, i));
  };
  
  const startDay = getStartOfWeek(weekOffset);
  
  const daysOfWeek = getDaysOfWeek(startDay);
  
  const handlePreviousWeek = () => {
    const newOffset = weekOffset - 1;
    setWeekOffset(newOffset);
    if (onPreviousWeek) onPreviousWeek();
  };
  
  const handleNextWeek = () => {
    const newOffset = weekOffset + 1;
    setWeekOffset(newOffset);
    if (onNextWeek) onNextWeek();
  };
  const formatDateForCompare = (date: Date) => {
    return format(date, 'yyyy-MM-dd');
  };
  
  const isShiftScheduled = (date: Date, shift: ShiftType) => {
    const formattedDate = formatDateForCompare(date);
    return schedules.some(
      (schedule) => 
        schedule.date === formattedDate && 
        schedule.shift === shift
    );
  };
  
  const getShiftStatus = (date: Date, shift: ShiftType): ScheduleStatus | null => {
    const formattedDate = formatDateForCompare(date);
    const schedule = schedules.find(
      (s) => s.date === formattedDate && s.shift === shift
    );
    return schedule ? schedule.status as ScheduleStatus : null;
  };
  
  const isSelected = (date: Date, shift: ShiftType) => {
    const formattedDate = formatDateForCompare(date);
    return formattedDate === selectedDate && shift === selectedShift;
  };
  const isInSelectedSlots = (date: Date, shift: ShiftType) => {
    const formattedDate = formatDateForCompare(date);
    return selectedSlots.some(slot => slot.date === formattedDate && slot.shift === shift);
  };
  
  const getDentistInfo = (date: Date, shift: ShiftType) => {
    const formattedDate = formatDateForCompare(date);
    const schedule = schedules.find(
      (s) => s.date === formattedDate && s.shift === shift
    );
    return schedule ? schedule.dentistName : null;
  };

  const renderShift = (date: Date, shift: ShiftType) => {
    const formattedDate = formatDateForCompare(date);
    const scheduled = isShiftScheduled(date, shift);
    const status = getShiftStatus(date, shift);
    const selected = isSelected(date, shift);
    const inSelectedSlots = isInSelectedSlots(date, shift);
    const isPast = disablePastDates && isPastDate(date);
    const dentistName = showDentistInfo ? getDentistInfo(date, shift) : null;
    
    const shiftNames = {
      [ShiftType.Morning]: "Sáng",
      [ShiftType.Afternoon]: "Chiều",
      [ShiftType.Evening]: "Tối",
    };

    const shiftTimes = {
      [ShiftType.Morning]: "8:00 - 11:00",
      [ShiftType.Afternoon]: "14:00 - 17:00",
      [ShiftType.Evening]: "17:00 - 20:00",
    };

    if (viewMode) {
      let className = "flex flex-col items-center justify-center min-h-[70px] rounded-md text-sm font-medium transition-colors cursor-pointer ";

      if (scheduled) {
        if (status === ScheduleStatus.Approved) {
          className += "bg-green-100 text-green-800 ";
        } else if (status === ScheduleStatus.Rejected) {
          className += "bg-red-100 text-red-800 ";  
        } else {
          className += "bg-yellow-100 text-yellow-800 ";
        }
      } else if (isPast) {
        className += "bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed ";
      } else if (canAddSchedule) {
        className += "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 ";
      } else {
        className += "bg-gray-50 text-gray-400 cursor-default ";
      }
      
      if (selected) {
        className += "ring-2 ring-blue-500 ";
      }
      
      if (inSelectedSlots) {
        className += "ring-2 ring-purple-500 bg-purple-50 text-purple-800 ";
      }

      return (
        <div
          className={className}
          onClick={() => {
            if (isPast && !scheduled) return;
            
            if (isMultiSelectMode && onSlotSelect && (canAddSchedule || scheduled)) {
              onSlotSelect(formattedDate, shift);
            } else if ((canAddSchedule && !scheduled) || scheduled) {
              if (onDateSelect) {
                onDateSelect(formattedDate, shift);
              }
            }
          }}
        >
          <div className="text-center">
            <div className="font-medium">{shiftNames[shift]}</div>
            <div className="text-xs mt-0.5">{shiftTimes[shift]}</div>
            {showDentistInfo && dentistName && (
              <div className="text-xs mt-1 max-w-[90px] truncate" title={dentistName}>
                {dentistName}
              </div>
            )}
          </div>
        </div>
      );
    }

    const schedule = schedules.find(
      (s) => s.date === formattedDate && s.shift === shift
    );
    
    const shouldShowStatus = scheduled && schedule;

    let bgColor = '';
    let textColor = 'text-gray-600';
    let borderColor = 'border-gray-200';
    
    if (shouldShowStatus && status) {
      switch (status) {
        case ScheduleStatus.Approved:
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          borderColor = 'border-green-300';
          break;
        case ScheduleStatus.Pending:
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          borderColor = 'border-yellow-300';
          break;
        case ScheduleStatus.Rejected:
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          borderColor = 'border-red-300';
          break;
      }
    }

    if (inSelectedSlots) {
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-800';
      borderColor = 'border-purple-300';
    }

    if (selected) {
      borderColor = 'border-blue-500';
    }


    return (
      <div
        key={shift}
        className={`
          relative p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 min-h-[70px] flex flex-col justify-center
          ${bgColor || 'bg-gray-50'}
          ${borderColor}
          ${textColor}
          ${isPast && !shouldShowStatus ? 'opacity-50 cursor-not-allowed' : ''}
          ${canAddSchedule && !isPast ? 'hover:border-blue-400 hover:shadow-sm' : ''}
        `}
        onClick={() => {
          if (isPast && !shouldShowStatus) return;
          
          if (isMultiSelectMode && onSlotSelect && (canAddSchedule || scheduled)) {
            onSlotSelect(formattedDate, shift);
          } else if (canAddSchedule || scheduled) {
            if (onSlotSelect) {
              onSlotSelect(formattedDate, shift);
            } else if (onDateSelect) {
              onDateSelect(formattedDate, shift);
            }
          }
        }}
      >
        <div className="text-center">
          <div className="font-medium text-sm">
            {shiftNames[shift]}
          </div>
          <div className="text-xs mt-1">
            {shiftTimes[shift]}
          </div>
          {showDentistInfo && dentistName && (
            <div className="text-xs mt-1 max-w-[90px] truncate" title={dentistName}>
              {dentistName}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header với điều hướng tuần */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handlePreviousWeek}
          disabled={disablePastDates ? weekOffset <= 0 : weekOffset <= -2}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h3 className="text-base sm:text-lg font-medium text-gray-900 text-center px-2">
          {format(startDay, "d MMM", { locale: vi })} - {format(daysOfWeek[6], "d MMM yyyy", { locale: vi })}
        </h3>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleNextWeek}
          disabled={weekOffset >= 8} // Giới hạn về tương lai (2 tháng)
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-7 gap-1 p-4">
          {/* Header các ngày trong tuần */}
          {daysOfWeek.map((day, i) => (
            <div key={`header-${i}`} className="text-center">
              <div className="font-medium text-sm text-gray-900">
                {format(day, "EEEE", { locale: vi })}
              </div>
              <div className={cn(
                "text-xs mt-1 inline-block px-2 py-1 rounded-full",
                format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-500"
              )}>
                {format(day, "d/MM")}
              </div>
            </div>
          ))}
          
          {/* Ca sáng */}
          {daysOfWeek.map((day, i) => (
            <div key={`morning-${i}`} className="pt-2">
              {renderShift(day, ShiftType.Morning)}
            </div>
          ))}
          
          {/* Ca chiều */}
          {daysOfWeek.map((day, i) => (
            <div key={`afternoon-${i}`} className="pt-2">
              {renderShift(day, ShiftType.Afternoon)}
            </div>
          ))}
          
          {/* Ca tối */}
          {daysOfWeek.map((day, i) => (
            <div key={`evening-${i}`} className="pt-2">
              {renderShift(day, ShiftType.Evening)}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[700px] p-3">
            <div className="grid grid-cols-7 gap-2">
              {/* Header các ngày trong tuần */}
              {daysOfWeek.map((day, i) => (
                <div key={`header-${i}`} className="text-center min-w-[90px]">
                  <div className="font-medium text-xs text-gray-900">
                    {format(day, "EEE", { locale: vi })}
                  </div>
                  <div className={cn(
                    "text-xs mt-1 inline-block px-2 py-1 rounded-full",
                    format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                      ? "bg-blue-100 text-blue-800"
                      : "text-gray-500"
                  )}>
                    {format(day, "d/MM")}
                  </div>
                </div>
              ))}
              
              {/* Ca sáng */}
              {daysOfWeek.map((day, i) => (
                <div key={`morning-${i}`} className="pt-2 min-w-[90px]">
                  {renderShift(day, ShiftType.Morning)}
                </div>
              ))}
              
              {/* Ca chiều */}
              {daysOfWeek.map((day, i) => (
                <div key={`afternoon-${i}`} className="pt-2 min-w-[90px]">
                  {renderShift(day, ShiftType.Afternoon)}
                </div>
              ))}
              
              {/* Ca tối */}
              {daysOfWeek.map((day, i) => (
                <div key={`evening-${i}`} className="pt-2 min-w-[90px]">
                  {renderShift(day, ShiftType.Evening)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Chú thích */}
      <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t border-gray-200">
        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-600">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-green-100 rounded-full mr-1"></span>
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
            <span>Đã duyệt</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-yellow-100 rounded-full mr-1"></span>
            <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
            <span>Chờ duyệt</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-100 rounded-full mr-1"></span>
            <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1.5"></span>
            <span>Từ chối</span>
          </div>
          {canAddSchedule && (
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-gray-100 rounded-full mr-1"></span>
              <span>Có thể đăng ký</span>
            </div>
          )}
          {isMultiSelectMode && (
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-purple-50 rounded-full mr-1 ring-1 ring-purple-500"></span>
              <span>Đã chọn</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};