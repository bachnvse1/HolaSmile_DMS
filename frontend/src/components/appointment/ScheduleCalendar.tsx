import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import type { Dentist, TimeSlot } from '../../types/appointment';
import { TIME_SLOTS } from '../../constants/appointment';
import { getDatesForWeek, getWeekDateRange, isToday, getShortDayName, formatDate, getDateString } from '../../utils/date';
import { isTimeSlotAvailable } from '../../utils/schedule';
import { Button } from '../ui/button';

interface ScheduleCalendarProps {
  dentist: Dentist;
  currentWeek: number;
  selectedDate: string;
  selectedTimeSlot: string;
  onDateSelect: (date: string, timeSlot: string) => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  dentist,
  currentWeek,
  selectedDate,
  selectedTimeSlot,
  onDateSelect,
  onPreviousWeek,
  onNextWeek
}) => {
  const weekDates = getDatesForWeek(currentWeek);
  const weekRange = getWeekDateRange(weekDates);
  const weekLabel = currentWeek === 0 ? 'Tuần 1' : 'Tuần 2';

  // Tạo time slots với icon
  const timeSlotsWithIcons: TimeSlot[] = TIME_SLOTS.map(slot => ({
    ...slot,
    icon: <Clock className="h-4 w-4" />
  }));

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />
          Lịch Làm Việc - {dentist.name}
        </h3>
        <div className="flex items-center space-x-4">
          <Button
            onClick={onPreviousWeek}
            disabled={currentWeek === 0}
            className="p-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center min-w-[200px]">
            <div className="text-lg font-bold text-gray-900">{weekLabel}</div>
            <div className="text-sm text-gray-600">{weekRange}</div>
          </div>
          <Button
            onClick={onNextWeek}
            disabled={currentWeek === 1}
            className="p-3 rounded-xl border-2 border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        {/* Calendar Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="col-span-1"></div>
          {weekDates.map((date) => (
            <div
              key={getDateString(date)}
              className={`text-center p-3 rounded-xl border transition-all ${
                isToday(date)
                  ? 'bg-blue-100 border-blue-300 text-blue-900'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="text-xs font-medium text-gray-600">
                {getShortDayName(date)}
              </div>
              <div className="text-sm font-bold text-gray-900">
                {formatDate(date)}
              </div>
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        {timeSlotsWithIcons.map((slot) => (
          <div key={slot.period} className="grid grid-cols-8 gap-2 mb-3">
            <div className="col-span-1 flex items-center p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl">
              <div className="text-center w-full">
                <div className="flex items-center justify-center mb-1">
                  {slot.icon}
                </div>
                <div className="text-xs font-semibold">{slot.label}</div>
                <div className="text-xs opacity-90">{slot.timeRange}</div>
              </div>
            </div>
            {weekDates.map((date) => {
              const dateString = getDateString(date);
              const isAvailable = isTimeSlotAvailable(dentist.schedule, dateString, slot.period);
              const isSelected = selectedDate === dateString && selectedTimeSlot === slot.period;
              
              return (
                <button
                  key={`${dateString}-${slot.period}`}
                  onClick={() => {
                    if (isAvailable) {
                      onDateSelect(dateString, slot.period);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`p-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
                    isAvailable
                      ? isSelected
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg border-2 border-green-400'
                        : 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 border-2 border-green-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
                  }`}
                >
                  <div className="text-xs">
                    {isAvailable ? (isSelected ? 'Đã chọn' : 'Có thể đặt') : 'Không có'}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};