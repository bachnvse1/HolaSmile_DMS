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

interface Props {
  /** Danh sách lịch (đã lọc Pending ở trên) */
  schedules: Schedule[];
  /** Callback khi click 1 lịch (để chọn phê duyệt / từ chối) */
  onScheduleSelect?: (scheduleId: number) => void;
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
    [ShiftType.Afternoon]: "13:00 – 17:00",
    [ShiftType.Evening]: "17:00 – 20:00"
  };

  const shifts: ShiftType[] = [
    ShiftType.Morning,
    ShiftType.Afternoon,
    ShiftType.Evening
  ];

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
      {/* Header tuần */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekOffset(o => o - 1)}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h3 className="text-lg font-medium text-gray-900">
          {format(startDay, "d MMMM", { locale: vi })} –{" "}
          {format(daysOfWeek[6], "d MMMM yyyy", { locale: vi })}
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
  );
};
