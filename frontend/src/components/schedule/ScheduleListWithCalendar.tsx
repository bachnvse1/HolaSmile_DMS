import { useAuth } from '@/hooks/useAuth';
import React, { useState } from 'react';
import { useAllDentistSchedules, useDentistSchedule } from '../../hooks/useSchedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import type { Schedule } from '../../types/schedule';
import { formatDateWithDay, shiftTypeToText } from '../../utils/dateUtils';
import {
  Loader2,
  List,
  Calendar as CalendarIcon,
  Filter,
  Search,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ScheduleCalendarEnhanced } from './ScheduleCalendarEnhanced';

interface ScheduleListProps {
  dentistId?: number;
}

export const ScheduleListWithCalendar: React.FC<ScheduleListProps> = ({ dentistId }) => {
  // States
  const { role } = useAuth?.() || {}; // hoặc const role = TokenUtils.getUserData().role;
  const isDentist = role === 'Dentist';
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('calendar');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming'); // 'all', 'upcoming', 'past'

  // Queries
  const { data: dentistData, isLoading: isDentistLoading } = useDentistSchedule(dentistId);
  const { data: allDentistsData, isLoading: isAllDentistsLoading } = useAllDentistSchedules();

  const isLoading = dentistId ? isDentistLoading : isAllDentistsLoading;

  // Use appropriate data based on the dentistId
  const schedules = dentistId
    ? (dentistData?.data || [])
    : (allDentistsData?.data || []);

  // Filters
  const filteredSchedules = schedules.filter((schedule: Schedule) => {
    // Status filter
    if (schedule.status !== ScheduleStatus.Approved) return false;

    // Shift filter
    if (shiftFilter !== 'all' && schedule.shift !== shiftFilter) return false;

    // Search term - search by dentist name
    if (searchTerm.trim() && schedule.dentistName) {
      return schedule.dentistName.toLowerCase().includes(searchTerm.toLowerCase());
    }

    return true;
  });


  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShiftFilter('all');
    setDateFilter('upcoming');
  };


  // Render status badge
  const renderStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case ScheduleStatus.Approved:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Đã duyệt</Badge>;
      case ScheduleStatus.Rejected:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Từ chối</Badge>;
      case ScheduleStatus.Pending:
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>;
    }
  };

  // Render the list view
  const renderScheduleList = () => {
    if (filteredSchedules.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Không có lịch làm việc nào phù hợp với bộ lọc.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={handleResetFilters}
          >
            Xóa bộ lọc
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {!dentistId && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bác sĩ
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ca làm việc
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchedules.map((schedule: Schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50">
                {!dentistId && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{schedule.dentistName || 'Không rõ'}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDateWithDay(schedule.date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{shiftTypeToText(schedule.shift as ShiftType)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderStatusBadge(schedule.status as ScheduleStatus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{schedule.note || '—'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render the component
  return (
    <div>
      {/* Header with filters and view toggle */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          {!isDentist && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Tìm theo tên bác sĩ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-auto min-w-[240px]"
            />            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2.5 top-2.5 h-4 w-4 p-0 text-gray-400 hover:text-gray-600"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-blue-50 text-blue-700" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex p-1 bg-muted rounded-md">
          <Button
            size="sm"
            variant={activeView === 'calendar' ? 'default' : 'ghost'}
            onClick={() => setActiveView('calendar')}
            className="flex items-center"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Lịch
          </Button>
          <Button
            size="sm"
            variant={activeView === 'list' ? 'default' : 'ghost'}
            onClick={() => setActiveView('list')}
            className="flex items-center"
          >
            <List className="h-4 w-4 mr-2" />
            Danh sách
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4">            <div className="flex-1 min-w-[150px]">
            <label htmlFor="statusFilter" className="mb-1.5 block text-sm font-medium">Trạng thái</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value={ScheduleStatus.Pending}>Chờ duyệt</SelectItem>
                <SelectItem value={ScheduleStatus.Approved}>Đã duyệt</SelectItem>
                <SelectItem value={ScheduleStatus.Rejected}>Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="shiftFilter" className="mb-1.5 block text-sm font-medium">Ca làm việc</label>
              <Select value={shiftFilter} onValueChange={setShiftFilter}>
                <SelectTrigger id="shiftFilter">
                  <SelectValue placeholder="Chọn ca làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value={ShiftType.Morning}>Sáng</SelectItem>
                  <SelectItem value={ShiftType.Afternoon}>Chiều</SelectItem>
                  <SelectItem value={ShiftType.Evening}>Tối</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[150px]">
              <label htmlFor="dateFilter" className="mb-1.5 block text-sm font-medium">Thời gian</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="dateFilter">
                  <SelectValue placeholder="Chọn thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="upcoming">Sắp tới</SelectItem>
                  <SelectItem value="past">Đã qua</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
        </div>
      ) : (
        // Content - Calendar or List view
        <div>
          {activeView === 'calendar' ? (
            <ScheduleCalendarEnhanced
              schedules={filteredSchedules}
              showDentistInfo={!dentistId}
              disablePastDates={false}

            />
          ) : (
            renderScheduleList()
          )}

          {/* Show result count */}
          <div className="mt-4 text-sm text-gray-500">
            Hiển thị {filteredSchedules.length} lịch làm việc
          </div>
        </div>
      )}
    </div>
  );
};