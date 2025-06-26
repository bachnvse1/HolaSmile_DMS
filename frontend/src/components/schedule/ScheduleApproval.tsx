import React, { useState } from 'react';
import { useAllDentistSchedules, useApproveSchedules } from '../../hooks/useSchedule';
import type { Schedule } from '../../types/schedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import { formatDateWithDay, shiftTypeToText } from '../../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  InfoIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { startOfWeek, addDays, format } from 'date-fns';
export const ScheduleApproval: React.FC = () => {
  // States
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'confirm' | 'reject' | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const shifts = [
    { key: 'morning', label: 'Sáng', time: '8:00 - 11:00' },
    { key: 'afternoon', label: 'Chiều', time: '13:00 - 17:00' },
    { key: 'evening', label: 'Tối', time: '17:00 - 20:00' },
  ];

  const today = new Date();
  const weekStart = startOfWeek(addDays(today, currentWeekOffset * 7), { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Queries
  const {
    data,
    isLoading,
    error
  } = useAllDentistSchedules();
  console.log('All schedules:', data);
  // Mutations
  const approveMutation = useApproveSchedules();

  // Lọc schedules theo trạng thái pending và theo searchTerm nếu có
  const pendingSchedules = React.useMemo(() => {
    if (!data) return [];

    // Gộp tất cả schedules của các bác sĩ thành một mảng
    const allSchedules = data.flatMap((dentist: any) =>
      (dentist.schedules || []).map((sch: any) => ({
        ...sch,
        dentistName: dentist.dentistName,
        dentistID: dentist.dentistID,
      }))
    );

    return allSchedules
      .filter((schedule: any) => {
        // Chỉ lấy lịch đang chờ duyệt
        return schedule.status === ScheduleStatus.Pending || schedule.status === 'pending';
      })
      .sort((a: any, b: any) => {
        // Sắp xếp theo ngày, mới nhất lên đầu
        return new Date(a.workDate).getTime() - new Date(b.workDate).getTime();
      });
  }, [data, searchTerm]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedSchedules.length === pendingSchedules.length) {
      // Nếu đã chọn tất cả, bỏ chọn tất cả
      setSelectedSchedules([]);
    } else {
      // Nếu chưa chọn tất cả, chọn tất cả
      setSelectedSchedules(pendingSchedules.map((schedule: Schedule) => schedule.scheduleId as number));
    }
  };

  const handleSelectSchedule = (scheduleId: number) => {
    if (selectedSchedules.includes(scheduleId)) {
      // Bỏ chọn
      setSelectedSchedules(prev => prev.filter(id => id !== scheduleId));
    } else {
      // Chọn
      setSelectedSchedules(prev => [...prev, scheduleId]);
    }
  };

  const openApproveDialog = () => {
    if (selectedSchedules.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một lịch để phê duyệt!');
      return;
    }

    setApprovalAction('confirm');
    setConfirmDialogOpen(true);
  };

  const openRejectDialog = () => {
    if (selectedSchedules.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một lịch để từ chối!');
      return;
    }

    setApprovalAction('reject');
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
        approvalAction === 'approve'
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
  if (pendingSchedules.length === 0) {
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

      {/* Tuần điều hướng */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(o => o - 1)}>
          &larr; Tuần trước
        </Button>
        <div className="font-semibold text-base text-blue-700">
          {format(days[0], 'dd/MM/yyyy')} - {format(days[6], 'dd/MM/yyyy')}
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(o => o + 1)}>
          Tuần sau &rarr;
        </Button>
      </div>

      {/* Pending Schedule List */}
      <Card>
        <CardHeader>
          <CardTitle>Phê duyệt lịch làm việc dạng lịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-2 w-32">Ca làm việc</th>
                  {days.map((day, idx) => (
                    <th key={idx} className={
                      `border px-2 py-2 text-center ${format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-50 text-blue-700 font-bold' : ''}`
                    }>
                      {format(day, 'EEE dd/MM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.key}>
                    <td className="border px-2 py-2 font-medium">
                      {shift.label}
                      <div className="text-xs text-gray-500">{shift.time}</div>
                    </td>
                    {days.map((day, idx) => {
                      // Lấy các lịch pending ở slot này
                      const slotSchedules = pendingSchedules.filter(
                        s =>
                          s.shift === shift.key &&
                          format(new Date(s.workDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                      );
                      return (
                        <td key={idx} className="border px-2 py-2 min-h-[48px]">
                          {slotSchedules.length === 0 ? (
                            <span className="text-gray-300 text-xs">—</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              {slotSchedules.map(sch => {
                                // Màu badge theo dentistID
                                const badgeColor = sch.dentistID % 3 === 1
                                  ? 'bg-blue-100 text-blue-800'
                                  : sch.dentistID % 3 === 2
                                  ? 'bg-pink-100 text-pink-800'
                                  : 'bg-purple-100 text-purple-800';
                                return (
                                  <Badge
                                    key={sch.scheduleId}
                                    variant={selectedSchedules.includes(sch.scheduleId) ? 'info' : 'outline'}
                                    className={`cursor-pointer ${selectedSchedules.includes(sch.scheduleId) ? 'ring-2 ring-blue-400' : ''} ${badgeColor}`}
                                    onClick={() => handleSelectSchedule(sch.scheduleId)}
                                  >
                                    {sch.dentistName}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Các nút phê duyệt/từ chối giữ nguyên */}
          <div className="flex gap-2 mt-4">
            <Button onClick={openApproveDialog} disabled={selectedSchedules.length === 0}>Phê duyệt</Button>
            <Button variant="outline" onClick={openRejectDialog} disabled={selectedSchedules.length === 0}>Từ chối</Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'confirm' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'confirm'
                ? `Bạn có chắc chắn muốn phê duyệt ${selectedSchedules.length} lịch làm việc đã chọn?`
                : `Bạn có chắc chắn muốn từ chối ${selectedSchedules.length} lịch làm việc đã chọn?`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {approvalAction === 'confirm'
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
              variant={approvalAction === 'confirm' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {approvalAction === 'confirm' ? (
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