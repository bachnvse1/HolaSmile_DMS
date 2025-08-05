// ScheduleCalendarApproval.tsx
import React, { useState } from "react";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { vi } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShiftType } from "@/types/schedule";
import type { Schedule } from "@/types/schedule";
import { cn } from "@/lib/utils";
import { startOfDay } from "date-fns";

interface Props {
  /** Danh sách lịch (đã lọc Pending ở trên) */
  schedules: Schedule[];
  /** Callback khi click 1 lịch (để chọn phê duyệt / từ chối) */
  onScheduleSelect?: (scheduleId: number | number[]) => void;
  /** Mảng id lịch đang được chọn (highlight) */
  selectedScheduleIds?: number[];
  viewOnly?: boolean;
}

export const ScheduleCalendarApproval: React.FC<Props> = ({
  schedules,
  onScheduleSelect,
  selectedScheduleIds = [],
  viewOnly = false
}) => {
  /* ====== tính tuần ====== */
  const [weekOffset, setWeekOffset] = useState(0);
  const startDay = startOfWeek(addWeeks(new Date(), weekOffset), {
    weekStartsOn: 1
  });
  const daysOfWeek = Array.from({ length: 7 }, (_, i) =>
    addDays(startDay, i)
  );

  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  const todayStr = fmt(new Date());

  /* ====== hằng số ca ====== */
  const shiftNames = {
    [ShiftType.Morning]: "Sáng",
    [ShiftType.Afternoon]: "Chiều",
    [ShiftType.Evening]: "Tối"
  };

  const shiftTimes = {
    [ShiftType.Morning]: "8:00 – 11:00",
    [ShiftType.Afternoon]: "14:00 – 17:00",
    [ShiftType.Evening]: "17:00 – 20:00"
  };

  const shifts: ShiftType[] = [
    ShiftType.Morning,
    ShiftType.Afternoon,
    ShiftType.Evening
  ];
  const getPendingSchedules = () => {
    return schedules.filter(schedule => schedule.status === 'pending');
  };

  const getCurrentWeekPendingSchedules = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1)); // Thứ hai

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Chủ nhật

    return schedules.filter(schedule => {
      if (schedule.status !== 'pending') return false;
      const scheduleDate = startOfDay(new Date(schedule.workDate || schedule.date));
      return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
    });
  };

  const getCurrentAndNextWeekPendingSchedules = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1)); // Thứ hai tuần hiện tại

    const endOfNextWeek = new Date(startOfWeek);
    endOfNextWeek.setDate(startOfWeek.getDate() + 13); // Chủ nhật tuần sau

    return schedules.filter(schedule => {
      if (schedule.status !== 'pending') return false;
      const scheduleDate = startOfDay(new Date(schedule.workDate || schedule.date));
      return scheduleDate >= startOfWeek && scheduleDate <= endOfNextWeek;
    });
  };

  // Handlers cho các nút chọn nhanh
  const handleSelectAllPending = () => {
    const pendingSchedules = getPendingSchedules();
    const scheduleIds = pendingSchedules.map(schedule => schedule.scheduleId).filter((id): id is number => id !== undefined);
    onScheduleSelect?.(scheduleIds);
  };

  const handleSelectCurrentWeekPending = () => {
    const currentWeekPending = getCurrentWeekPendingSchedules();
    const scheduleIds = currentWeekPending.map(schedule => schedule.scheduleId).filter((id): id is number => id !== undefined);
    onScheduleSelect?.(scheduleIds);
  };

  const handleSelectCurrentAndNextWeekPending = () => {
    const currentAndNextWeekPending = getCurrentAndNextWeekPendingSchedules();
    const scheduleIds = currentAndNextWeekPending.map(schedule => schedule.scheduleId).filter((id): id is number => id !== undefined);
    onScheduleSelect?.(scheduleIds);
  };

  /* ====== render 1 ô ====== */
  const getDateString = (dateStr: string) => dateStr.split('T')[0];
  const renderCell = (day: Date, shift: ShiftType) => {
    const cellSchedules = schedules.filter(
      s => s.shift === shift && getDateString(s.workDate || '') === fmt(day)
    );

    return (
      <div className="min-h-[90px] h-full rounded-md bg-gray-50 p-2 flex flex-col justify-center">
        {cellSchedules.length === 0 ? (
          <div className="text-gray-300 text-xs text-center">—</div>
        ) : (
          <div className="flex flex-col gap-2 h-full justify-center">
            {cellSchedules.map(sch => {
              let badgeColor = '';
              let clickable = false;
              if (sch.status === 'approved') {
                badgeColor = 'bg-green-100 text-green-800 border-green-300';
              } else if (sch.status === 'pending') {
                badgeColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                clickable = !viewOnly;
              } else if (sch.status === 'rejected') {
                badgeColor = 'bg-red-100 text-red-800 border-red-300';
              }
              const selected = selectedScheduleIds.includes(sch.scheduleId ?? -1);
              return (
                <Badge
                  key={sch.scheduleId}
                  variant="outline"
                  className={cn(
                    badgeColor,
                    'whitespace-normal break-words',
                    clickable ? 'cursor-pointer' : 'cursor-default',
                    selected && clickable && 'ring-2 ring-blue-500',
                    'w-full text-center px-2 py-1 text-[11px]'
                  )}
                  onClick={clickable ? () => onScheduleSelect?.(sch.scheduleId!) : undefined}
                  title={sch.dentistName}
                >
                  {sch.dentistName}
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {!viewOnly && (
        <div className="flex flex-wrap gap-2 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h3 className="w-full text-sm font-medium text-gray-700 mb-2">Chọn nhanh:</h3>

          <button
            onClick={handleSelectAllPending}
            className="px-2 sm:px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-md border border-blue-300 hover:bg-blue-200 transition-colors"
          >
            Tất cả lịch chờ duyệt ({getPendingSchedules().length})
          </button>

          <button
            onClick={handleSelectCurrentWeekPending}
            className="px-2 sm:px-3 py-2 text-xs bg-green-100 text-green-700 rounded-md border border-green-300 hover:bg-green-200 transition-colors"
          >
            Tuần hiện tại ({getCurrentWeekPendingSchedules().length})
          </button>

          <button
            onClick={handleSelectCurrentAndNextWeekPending}
            className="px-2 sm:px-3 py-2 text-xs bg-purple-100 text-purple-700 rounded-md border border-purple-300 hover:bg-purple-200 transition-colors"
          >
            Tuần hiện tại + tuần sau ({getCurrentAndNextWeekPendingSchedules().length})
          </button>

          {selectedScheduleIds.length > 0 && (
            <button
              onClick={() => onScheduleSelect?.([])}
              className="px-2 sm:px-3 py-2 text-xs bg-red-100 text-red-700 rounded-md border border-red-300 hover:bg-red-200 transition-colors"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      )}
      
      {/* Header tuần */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset(o => o - 1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-base sm:text-lg font-medium text-gray-900 text-center px-2">
          {format(startDay, "d MMM", { locale: vi })} –{" "}
          {format(daysOfWeek[6], "d MMM yyyy", { locale: vi })}
        </h3>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset(o => o + 1)}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        {/* Grid 8 cột (1 cột ca + 7 cột ngày) */}
        <div className="grid grid-cols-8 gap-1 p-4">
          {/* Header ngày */}
          <div /> {/* ô trống góc trái */}
          {daysOfWeek.map(d => (
            <div key={"h" + d} className="text-center">
              <div className="font-medium text-sm text-gray-900">
                {format(d, "EEEE", { locale: vi })}
              </div>
              <div
                className={cn(
                  "text-xs mt-1 inline-block px-2 py-1 rounded-full",
                  fmt(d) === todayStr ? "bg-blue-100 text-blue-800" : "text-gray-500"
                )}
              >
                {format(d, "d/MM")}
              </div>
            </div>
          ))}

          {/* 3 hàng ca */}
          {shifts.map(shift => (
            <React.Fragment key={shift}>
              {/* Cột ca cố định */}
              <div className="text-sm font-medium text-gray-700 py-2">
                {shiftNames[shift]}
                <div className="text-xs text-gray-400">{shiftTimes[shift]}</div>
              </div>

              {/* 7 ô ngày */}
              {daysOfWeek.map(day => (
                <div key={shift + fmt(day)} className="pt-2">
                  {renderCell(day, shift)}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px] p-3">
            {/* Grid 8 cột (1 cột ca + 7 cột ngày) */}
            <div className="grid grid-cols-8 gap-2">
              {/* Header ngày */}
              <div className="min-w-[80px]" /> {/* ô trống góc trái */}
              {daysOfWeek.map(d => (
                <div key={"h" + d} className="text-center min-w-[90px]">
                  <div className="font-medium text-xs text-gray-900">
                    {format(d, "EEE", { locale: vi })}
                  </div>
                  <div
                    className={cn(
                      "text-xs mt-1 inline-block px-2 py-1 rounded-full",
                      fmt(d) === todayStr ? "bg-blue-100 text-blue-800" : "text-gray-500"
                    )}
                  >
                    {format(d, "d/MM")}
                  </div>
                </div>
              ))}

              {/* 3 hàng ca */}
              {shifts.map(shift => (
                <React.Fragment key={shift}>
                  {/* Cột ca cố định */}
                  <div className="text-xs font-medium text-gray-700 py-2 min-w-[80px]">
                    <div>{shiftNames[shift]}</div>
                    <div className="text-xs text-gray-400">{shiftTimes[shift]}</div>
                  </div>

                  {/* 7 ô ngày */}
                  {daysOfWeek.map(day => (
                    <div key={shift + fmt(day)} className="pt-2 min-w-[90px]">
                      {renderCell(day, shift)}
                    </div>
                  ))}
                </React.Fragment>
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
          {!viewOnly && (
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-blue-50 rounded-full mr-1 ring-1 ring-blue-500"></span>
              <span>Đã chọn</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
