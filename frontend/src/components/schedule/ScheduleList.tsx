import React, { useState } from 'react';
import { useAllDentistSchedules, useDentistSchedule } from '../../hooks/useSchedule';
import type { Schedule } from '../../types/schedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import { formatDateWithDay, shiftTypeToText } from '../../utils/dateUtils';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Loader2, 
  ChevronDown,
  Search
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ScheduleListProps {
  dentistId?: number;
}

export const ScheduleList: React.FC<ScheduleListProps> = ({ dentistId }) => {
  // State cho filters
  const [filters, setFilters] = useState({
    shift: '',
    status: '',
    date: undefined as Date | undefined,
    searchTerm: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch data dựa vào dentistId (nếu có) hoặc tất cả lịch
  const dentistScheduleQuery = useDentistSchedule(dentistId || 0);
  const allSchedulesQuery = useAllDentistSchedules();
  
  const { data, isLoading, error } = dentistId ? dentistScheduleQuery : allSchedulesQuery;
  
  // Lọc schedules dựa trên filters
  const filteredSchedules = React.useMemo(() => {
    if (!data?.data) return [];
    
    return data.data.filter((schedule: Schedule) => {
      // Lọc theo searchTerm nếu có
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const dentistName = schedule.dentistName?.toLowerCase() || '';
        const date = formatDateWithDay(schedule.date).toLowerCase();
        
        if (!dentistName.includes(term) && !date.includes(term)) {
          return false;
        }
      }
      
      // Lọc theo ca
      if (filters.shift && schedule.shift !== filters.shift) return false;
      
      // Lọc theo trạng thái
      if (filters.status && schedule.status !== filters.status) return false;
      
      // Lọc theo ngày
      if (filters.date) {
        const scheduleDate = new Date(schedule.date);
        const filterDate = new Date(filters.date);
        
        if (
          scheduleDate.getFullYear() !== filterDate.getFullYear() ||
          scheduleDate.getMonth() !== filterDate.getMonth() ||
          scheduleDate.getDate() !== filterDate.getDate()
        ) {
          return false;
        }
      }
      
      return true;
    });
  }, [data, filters]);
  
  // Render badge status
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
  
  // Xử lý reset filters
  const handleResetFilters = () => {
    setFilters({
      shift: '',
      status: '',
      date: undefined,
      searchTerm: ''
    });
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800">
        <p>Đã xảy ra lỗi khi tải dữ liệu: {error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
      </div>
    );
  }
  
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Không có lịch làm việc nào được tìm thấy.</p>
        {dentistId && (
          <p className="mt-2 text-sm text-gray-500">
            Vui lòng thêm lịch làm việc của bạn ở tab "Quản lý lịch cá nhân".
          </p>
        )}
      </div>
    );
  }
  
  return (
    <div>
      {/* Search và Filter controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Tìm kiếm theo bác sĩ, ngày..."
          />
        </div>
        
        {/* Filter Button */}
        <div>
          <Button 
            variant="outline" 
            className="flex items-center w-full md:w-auto"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Bộ lọc
            <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {/* Filter by shift */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ca làm việc</label>
            <Select
              value={filters.shift}
              onValueChange={(value) => setFilters({...filters, shift: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả ca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả ca</SelectItem>
                <SelectItem value={ShiftType.Morning}>{shiftTypeToText(ShiftType.Morning)}</SelectItem>
                <SelectItem value={ShiftType.Afternoon}>{shiftTypeToText(ShiftType.Afternoon)}</SelectItem>
                <SelectItem value={ShiftType.Evening}>{shiftTypeToText(ShiftType.Evening)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filter by status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả trạng thái</SelectItem>
                <SelectItem value={ScheduleStatus.Pending}>Chờ duyệt</SelectItem>
                <SelectItem value={ScheduleStatus.Approved}>Đã duyệt</SelectItem>
                <SelectItem value={ScheduleStatus.Rejected}>Từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Filter by date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date ? format(filters.date, 'dd/MM/yyyy') : 'Chọn ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date}
                  onSelect={(date) => setFilters({...filters, date})}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Reset filters button */}
          <div className="md:col-span-3 mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-blue-600"
              onClick={handleResetFilters}
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      )}
      
      {/* Schedule List */}
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
                    <div className="font-medium text-gray-900">{schedule.dentistName}</div>
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
      
      {filteredSchedules.length === 0 && (
        <div className="text-center py-8 border-t">
          <p className="text-gray-500">Không tìm thấy lịch làm việc nào phù hợp với bộ lọc.</p>
        </div>
      )}
    </div>
  );
};