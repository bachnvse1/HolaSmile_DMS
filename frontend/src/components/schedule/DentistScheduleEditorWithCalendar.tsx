import React, { useState } from 'react';
import { useCreateSchedule, useEditSchedule, useDentistSchedule, useDeleteSchedule } from '../../hooks/useSchedule';
import type { Schedule } from '../../types/schedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import { formatDateWithDay, shiftTypeToText, isPastDate } from '../../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  Loader2,
  Edit,
  Trash,
  Check,
  X,
  AlertCircle,
  List,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';
import { ScheduleCalendar } from './ScheduleCalendar';

interface DentistScheduleEditorWithCalendarProps {
  dentistId?: number;
}

export const DentistScheduleEditorWithCalendar: React.FC<DentistScheduleEditorWithCalendarProps> = ({ dentistId }) => {
  // States
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType | ''>('');
  const [note, setNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('calendar');
  const [selectedSlots, setSelectedSlots] = useState<Array<{ date: string, shift: ShiftType }>>([]);
  const [isBulkCreateDialogOpen, setIsBulkCreateDialogOpen] = useState(false);
  // Queries and mutations
  const { data, isLoading, error, refetch } = useDentistSchedule(dentistId);
  const createScheduleMutation = useCreateSchedule();
  const editScheduleMutation = useEditSchedule();
  const deleteMutation = useDeleteSchedule();

  // Schedules data
  const schedules = data?.data || [];

  // Handlers
  // const handleAddSchedule = () => {
  //   setIsEditMode(false);
  //   setSelectedDate('');
  //   setSelectedShift('');
  //   setNote('');
  //   setIsDialogOpen(true);
  // };

  const handleEditSchedule = (schedule: Schedule) => {
    setIsEditMode(true);
    setCurrentSchedule(schedule);
    setSelectedDate(schedule.date);
    setSelectedShift(schedule.shift as ShiftType);
    setNote(schedule.note || '');
    setIsDialogOpen(true);
  };

  const handleDeleteSchedule = (schedule: Schedule) => {
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  // Xử lý xóa mềm lịch (set isActive = 0)
  const handleSoftDeleteSchedule = async (schedule: Schedule) => {
    if (!schedule.scheduleId) return;

    try {
      // Thử DELETE method thay vì PUT
      await deleteMutation.mutateAsync(schedule.scheduleId);

      toast.success('Đã hủy lịch làm việc thành công!');

      // Cập nhật lại dữ liệu
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy lịch!');
    }
  };

  const handleCalendarDateSelect = (date: string, shift: ShiftType) => {
    // Kiểm tra xem có phải lịch hiện tại không
    const schedule: Schedule | undefined = schedules.find((s: Schedule) => s.date === date && s.shift === shift);

    if (schedule) {
      // Nếu lịch có status pending và isActive = true, thực hiện xóa mềm
      if (schedule.status === ScheduleStatus.Pending && schedule.isActive) {
        handleSoftDeleteSchedule(schedule);
      }
      // Nếu là lịch rejected, xử lý như chưa có lịch (cho phép tạo mới) 
      else if (schedule.status === ScheduleStatus.Rejected) {
        setIsEditMode(false);
        setSelectedDate(date);
        setSelectedShift(shift);
        setNote('');
        setIsDialogOpen(true);
      } else {
        // Nếu là lịch khác (approved/rejected hoặc đã bị xóa mềm), mở dialog chỉnh sửa
        handleEditSchedule(schedule);
      }
    } else {
      // Nếu chưa có lịch, mở dialog thêm mới
      setIsEditMode(false);
      setSelectedDate(date);
      setSelectedShift(shift);
      setNote('');
      setIsDialogOpen(true);
    }
  };

  // Xử lý khi chọn nhiều ca làm việc
  const handleCalendarSlotSelect = (date: string, shift: ShiftType) => {
    // Kiểm tra xem có phải lịch hiện tại không
    const existingSchedule = schedules.find(s => s.date === date && s.shift === shift);

    if (existingSchedule) {
      // Nếu lịch có status pending và isActive = true, thực hiện xóa mềm
      if (existingSchedule.status === ScheduleStatus.Pending && existingSchedule.isActive) {
        handleSoftDeleteSchedule(existingSchedule);
      } else if (existingSchedule.status === ScheduleStatus.Rejected) {
        // Cho phép chọn/bỏ chọn slot như chưa có lịch
        const isAlreadySelected = selectedSlots.some(
          slot => slot.date === date && slot.shift === shift
        );
        if (isAlreadySelected) {
          setSelectedSlots(selectedSlots.filter(
            slot => !(slot.date === date && slot.shift === shift)
          ));
        } else {
          setSelectedSlots([...selectedSlots, { date, shift }]);
        }
      }
    } else {
      // Nếu chưa có lịch, thêm vào danh sách đã chọn
      const isAlreadySelected = selectedSlots.some(
        slot => slot.date === date && slot.shift === shift
      );

      if (isAlreadySelected) {
        // Nếu đã chọn, bỏ chọn
        setSelectedSlots(selectedSlots.filter(
          slot => !(slot.date === date && slot.shift === shift)
        ));
      } else {
        // Nếu chưa chọn, thêm vào danh sách
        setSelectedSlots([...selectedSlots, { date, shift }]);
      }
    }
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete || !scheduleToDelete.scheduleId) return;

    try {
      await deleteMutation.mutateAsync(scheduleToDelete.scheduleId);
      toast.success('Đã xóa lịch làm việc thành công!');
      setDeleteDialogOpen(false);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa lịch!');
    }
  };
  const handleSubmit = async () => {
    if (!selectedDate || !selectedShift || !dentistId) {
      toast.error('Vui lòng chọn đầy đủ thông tin!');
      return;
    }

    // Kiểm tra ngày trong quá khứ
    if (isPastDate(new Date(selectedDate))) {
      toast.error('Không thể đặt lịch cho ngày trong quá khứ!');
      return;
    }

    const scheduleData: Schedule = {
      dentistId,
      date: selectedDate,
      shift: selectedShift as ShiftType,
      status: ScheduleStatus.Pending,
      note: note.trim()
    };

    try {
      if (isEditMode && currentSchedule?.id) {
        // Chỉnh sửa lịch
        await editScheduleMutation.mutateAsync({
          ...scheduleData,
          id: currentSchedule.id
        });
        toast.success('Cập nhật lịch làm việc thành công!');
      } else {
        // Thêm lịch mới
        await createScheduleMutation.mutateAsync(scheduleData);
        toast.success('Thêm lịch làm việc thành công!');
      }

      // Đóng dialog
      setIsDialogOpen(false);

      // Cập nhật lại dữ liệu
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra!');
    }
  };
  // Xử lý tạo nhiều lịch làm việc cùng lúc
  const handleBulkCreateSchedules = async () => {
    if (!selectedSlots.length || !dentistId) {
      toast.error('Vui lòng chọn ít nhất một ca làm việc!');
      return;
    }

    try {

      // Tạo nhiều lịch làm việc
      const createPromises = selectedSlots.map(slot =>
        createScheduleMutation.mutateAsync({
          dentistId,
          date: slot.date,
          shift: slot.shift,
          status: ScheduleStatus.Pending,
          note: note.trim()
        })
      );

      const results = await Promise.allSettled(createPromises);

      // Đếm kết quả thành công và thất bại
      let successCount = 0;

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          console.error('Lỗi khi tạo lịch:', result.reason);
        }
      });

      // Hiển thị thông báo kết quả
      if (successCount > 0) {
        toast.success(`Đã tạo lịch làm việc thành công!`);
      }

      // Reset trạng thái
      setSelectedSlots([]);
      setIsBulkCreateDialogOpen(false);
      setNote('');

      // Cập nhật lại dữ liệu
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo lịch!');
    }
  };
  // Mở dialog tạo nhiều lịch
  const handleOpenBulkCreateDialog = () => {
    if (selectedSlots.length === 0) {
      toast.info('Vui lòng chọn ít nhất một ca làm việc trên lịch!');
      return;
    }

    setNote('');
    setIsBulkCreateDialogOpen(true);
  };

  // Xóa tất cả các ca đã chọn
  const clearSelectedSlots = () => {
    setSelectedSlots([]);
  };

  // Render danh sách lịch của bác sĩ
  const renderScheduleList = () => {
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

    if (schedules.length === 0) {
      return (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">Bạn chưa có lịch làm việc nào.</p>
          <p className="mt-2 text-sm text-gray-500">
            Nhấn nút "Thêm lịch làm việc" để tạo lịch mới.
          </p>
        </div>
      );
    }

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

    return (
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schedules.map((schedule: Schedule) => (
              <tr key={schedule.id} className="hover:bg-gray-50">
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
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2">
                    {schedule.status !== ScheduleStatus.Approved && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
                      </>
                    )}

                    {schedule.status === ScheduleStatus.Approved && (
                      <span className="text-xs text-gray-500 italic">Đã được duyệt</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Quản lý lịch làm việc của bạn. Lịch mới tạo sẽ cần được phê duyệt trước khi có hiệu lực.
        </p>
        <div className="flex space-x-3">
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

          {/* <Button onClick={handleAddSchedule} className="flex items-center">
            <PlusCircle className="h-4 w-4 mr-2" />
            Thêm lịch làm việc
          </Button> */}
        </div>
      </div>
      {/* Main content - Calendar or List view */}
      <div className="mb-6">
        {activeView === 'calendar' ? (
          <div>
            {selectedSlots.length > 0 && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-purple-800 font-medium">Đã chọn {selectedSlots.length} ca làm việc</span>
                    <p className="text-sm text-purple-700 mt-1">Nhấn "Thêm lịch làm việc" để đăng ký tất cả các ca đã chọn</p>
                  </div>
                  <div className="space-x-2">
                    <Button size="sm" variant="outline" onClick={clearSelectedSlots}>
                      Bỏ chọn tất cả
                    </Button>
                    <Button size="sm" onClick={handleOpenBulkCreateDialog}>
                      Thêm lịch làm việc
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <ScheduleCalendar
              schedules={schedules}
              onDateSelect={handleCalendarDateSelect}
              onSlotSelect={handleCalendarSlotSelect}
              selectedSlots={selectedSlots}
              canAddSchedule={true}
            />
          </div>
        ) : (
          renderScheduleList()
        )}
      </div>

      {/* Dialog for adding/editing schedule */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Chỉnh sửa lịch làm việc' : 'Thêm lịch làm việc mới'}</DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Cập nhật thông tin lịch làm việc'
                : 'Đăng ký lịch làm việc mới. Lịch sẽ cần được phê duyệt bởi quản trị viên.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedDate && selectedShift ? (
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <div className="font-medium text-blue-800 mb-1">Thông tin lịch làm việc:</div>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                  <div>Ngày:</div>
                  <div>{formatDateWithDay(selectedDate)}</div>
                  <div>Ca làm việc:</div>
                  <div>{shiftTypeToText(selectedShift as ShiftType)}</div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 p-4 rounded-md border border-amber-100">
                <div className="text-amber-800 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>Vui lòng chọn ca làm việc từ lịch</span>
                </div>
              </div>
            )}

            {/* <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú (không bắt buộc):</label>
              <Textarea
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                placeholder="Thêm ghi chú nếu cần..."
                className="min-h-[80px]"
              />
            </div> */}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={!selectedDate || !selectedShift || createScheduleMutation.isPending || editScheduleMutation.isPending}>
              {(createScheduleMutation.isPending || editScheduleMutation.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Cập nhật' : 'Thêm lịch'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa lịch làm việc</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa lịch làm việc này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          {scheduleToDelete && (
            <div className="my-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Ngày:</span>
                  <span className="text-sm">{formatDateWithDay(scheduleToDelete.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Ca làm việc:</span>
                  <span className="text-sm">{shiftTypeToText(scheduleToDelete.shift as ShiftType)}</span>
                </div>
                {scheduleToDelete.note && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Ghi chú:</span>
                    <span className="text-sm">{scheduleToDelete.note}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700 mt-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Lịch đã được duyệt không thể xóa.</span>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteSchedule}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Xác nhận xóa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk create dialog */}
      <Dialog open={isBulkCreateDialogOpen} onOpenChange={setIsBulkCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch làm việc hàng loạt</DialogTitle>
            <DialogDescription>
              Xác nhận tạo nhiều lịch làm việc cho các ca đã chọn. Lịch sẽ được tạo với trạng thái chờ duyệt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedSlots.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-10">
                <p>Không có ca làm việc nào được chọn.</p>
                <p className="mt-2">
                  Vui lòng quay lại lịch và chọn các ca làm việc bạn muốn tạo lịch.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-sm font-medium text-gray-800 mb-2">
                  Các ca làm việc đã chọn:
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  {selectedSlots.map((slot, index) => (
                    <div key={index} className="flex justify-between py-2 px-3 rounded-md bg-gray-50 border">
                      <div>
                        <div className="font-medium">{formatDateWithDay(slot.date)}</div>
                        <div className="text-gray-500">{shiftTypeToText(slot.shift)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú cho tất cả lịch (không bắt buộc):</label>
              <Textarea
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                placeholder="Thêm ghi chú chung cho các lịch này..."
                className="min-h-[80px]"
              />
            </div>
          </div> */}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCreateDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleBulkCreateSchedules} disabled={createScheduleMutation.isPending}>
              {createScheduleMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Tạo lịch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};