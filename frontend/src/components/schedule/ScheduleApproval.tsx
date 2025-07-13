import React, { useState } from 'react';
import { useAllDentistSchedules, useApproveSchedules } from '../../hooks/useSchedule';
import type { Schedule } from '../../types/schedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import { Button } from '@/components/ui/button';
import { ScheduleCalendarApproval } from './ScheduleCalendarApproval';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  InfoIcon,
  Filter,
  X,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
export const ScheduleApproval: React.FC<{ viewOnlyApproved?: boolean }> = ({ viewOnlyApproved }) => {
  // States
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'rejected' | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shiftFilter, setShiftFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all')
  // Queries
  const {
    data,
    isLoading,
    error
  } = useAllDentistSchedules();
  // Mutations
  const approveMutation = useApproveSchedules();

  // Gộp tất cả schedules của các bác sĩ thành một mảng
  const allSchedules = React.useMemo(() => {
    if (!data) return [];
    const result = data.flatMap((dentist: any) =>
      (dentist.schedules || []).map((sch: any) => ({
        ...sch,
        dentistName: dentist.dentistName,
        dentistID: dentist.dentistID,
      }))
    );
    return result;
  }, [data]);

  const isUpcoming = (dateStr: string) => new Date(dateStr) >= new Date();
  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  // Filters
  const filteredSchedules = allSchedules.filter((schedule: Schedule) => {
    // Nếu chỉ xem các lịch đã approved
    if (viewOnlyApproved && schedule.status !== ScheduleStatus.Approved) return false;
    // Status filter
    if (!viewOnlyApproved && statusFilter !== "all" && schedule.status !== statusFilter) return false;
    // Shift filter
    if (shiftFilter !== 'all' && schedule.shift !== shiftFilter) return false;
    // Search term - search by dentist name
    if (searchTerm.trim() && schedule.dentistName) {
      return schedule.dentistName.toLowerCase().includes(searchTerm.toLowerCase());
    }
    if (
      (dateFilter === "upcoming" && (!schedule.workDate || !isUpcoming(schedule.workDate))) ||
      (dateFilter === "past" && (!schedule.workDate || !isPast(schedule.workDate)))
    ) return false;
    return true;
  });


  // Handle filter reset
  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setShiftFilter('all');
    setDateFilter('all');
  };

  // Lọc schedules theo trạng thái pending và theo searchTerm nếu có
  const pendingSchedules = React.useMemo(() => {
    return allSchedules
      .filter((schedule: any) => {
        // Chỉ lấy lịch đang chờ duyệt
        return schedule.status === ScheduleStatus.Pending || schedule.status === 'pending';
      })
      .sort((a: any, b: any) => {
        // Sắp xếp theo ngày, mới nhất lên đầu
        return new Date(a.workDate).getTime() - new Date(b.workDate).getTime();
      });
  }, [allSchedules, searchTerm]);

  const handleSelectSchedule = (ids: number | number[]) => {
    if (Array.isArray(ids)) {
      setSelectedSchedules(ids); // Chọn nhanh: set toàn bộ
    } else {
      setSelectedSchedules(prev =>
        prev.includes(ids)
          ? prev.filter(id => id !== ids) // Nếu đã chọn thì bỏ chọn
          : [...prev, ids]                // Nếu chưa chọn thì thêm vào
      );
    }
  };

  const openApproveDialog = () => {
    if (selectedSchedules.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một lịch để phê duyệt!');
      return;
    }

    setApprovalAction('approved');
    setConfirmDialogOpen(true);
  };

  const openRejectDialog = () => {
    if (selectedSchedules.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một lịch để từ chối!');
      return;
    }

    setApprovalAction('rejected');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!approvalAction) return;

    try {
      await approveMutation.mutateAsync({
        scheduleIds: selectedSchedules,
        action: approvalAction
      });

      toast.success(
        approvalAction === 'approved'
          ? `Đã phê duyệt ${selectedSchedules.length} lịch làm việc!`
          : `Đã từ chối ${selectedSchedules.length} lịch làm việc!`
      );

      setSelectedSchedules([]);
      setConfirmDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra!');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800">
        <p>Đã xảy ra lỗi khi tải dữ liệu: {error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
      </div>
    );
  }

  // Không có lịch cần phê duyệt
  if (pendingSchedules.length === 0 && !viewOnlyApproved) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có lịch nào cần phê duyệt!</h3>
        <p className="text-gray-600">Tất cả lịch làm việc đã được xử lý.</p>
      </div>
    );
  }

  if (viewOnlyApproved) {
    return (
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo tên bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-auto min-w-[240px]"
              />
              {searchTerm && (
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-blue-50 text-blue-700" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-4">

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
          </div>
        )}
        <div className="overflow-x-auto">
          <ScheduleCalendarApproval
            schedules={filteredSchedules}
            selectedScheduleIds={[]}
            onScheduleSelect={() => { }}
            viewOnly
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header with info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
        <div className="flex items-start">
          <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Hướng dẫn phê duyệt:</h3>
            <p className="text-sm text-blue-700 mt-1">
              Lịch sau khi được phê duyệt sẽ được hiển thị cho bệnh nhân đặt lịch.
              Hãy kiểm tra kỹ thông tin trước khi phê duyệt.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
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

          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-blue-50 text-blue-700" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
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
      {/* Pending Schedule List */}
      <div className="overflow-x-auto">
        <ScheduleCalendarApproval
          schedules={filteredSchedules}
          selectedScheduleIds={selectedSchedules}
          onScheduleSelect={handleSelectSchedule}
        />
      </div>
      {/* Các nút phê duyệt/từ chối giữ nguyên */}
      <div className="flex gap-2 mt-4">
        <Button onClick={openApproveDialog} disabled={selectedSchedules.length === 0}>Phê duyệt</Button>
        <Button variant="outline" onClick={openRejectDialog} disabled={selectedSchedules.length === 0}>Từ chối</Button>
      </div>


      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approved' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approved'
                ? `Bạn có chắc chắn muốn phê duyệt ${selectedSchedules.length} lịch làm việc đã chọn?`
                : `Bạn có chắc chắn muốn từ chối ${selectedSchedules.length} lịch làm việc đã chọn?`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {approvalAction === 'approved'
                  ? 'Lịch được phê duyệt sẽ hiển thị cho bệnh nhân đặt lịch hẹn.'
                  : 'Lịch bị từ chối sẽ không hiển thị cho bệnh nhân và cần được tạo lại.'}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={approveMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant={approvalAction === 'approved' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending}
              className={approvalAction === 'rejected' ? 'text-white' : ''}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {approvalAction === 'approved' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Xác nhận phê duyệt
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Xác nhận từ chối
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};