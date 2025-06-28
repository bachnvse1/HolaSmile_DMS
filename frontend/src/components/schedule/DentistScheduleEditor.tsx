import React, { useState } from 'react';
import { useCreateSchedule, useEditSchedule, useDentistSchedule } from '../../hooks/useSchedule';
import type { Schedule } from '../../types/schedule';
import { ScheduleStatus, ShiftType } from '../../types/schedule';
import { formatDateWithDay, shiftTypeToText, isPastDate } from '../../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusCircle, 
  Loader2, 
  Edit,
  Trash,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface DentistScheduleEditorProps {
  dentistId?: number;
}

export const DentistScheduleEditor: React.FC<DentistScheduleEditorProps> = ({ dentistId }) => {
  // States  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<ShiftType | ''>('');
  const [note, setNote] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null);
  
  // Queries and mutations
  const { data, isLoading, error } = useDentistSchedule(dentistId);
  const createScheduleMutation = useCreateSchedule();
  const editScheduleMutation = useEditSchedule();
    // Handlers
  const handleAddSchedule = () => {
    setIsEditMode(false);
    setSelectedDate('');
    setSelectedShift('');
    setNote('');
    setIsDialogOpen(true);
  };
  
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
  
//   const handleCalendarDateSelect = (date: string, shift: ShiftType) => {
//     // Kiểm tra xem có phải lịch hiện tại không
//     const schedule = schedules.find(s => s.date === date && s.shift === shift);
    
//     if (schedule) {
//       // Nếu đã có lịch, mở dialog chỉnh sửa
//       handleEditSchedule(schedule);
//     } else {
//       // Nếu chưa có lịch, mở dialog thêm mới
//       setIsEditMode(false);
//       setSelectedDate(date);
//       setSelectedShift(shift);
//       setNote('');
//       setIsDialogOpen(true);
//     }
//   };
  
  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete || !scheduleToDelete.id) return;
    
    try {
      // Sử dụng editScheduleMutation để đánh dấu lịch là đã xóa
      // Thực tế, bạn có thể cần một API riêng để xóa lịch
      await editScheduleMutation.mutateAsync({
        ...scheduleToDelete,
        status: ScheduleStatus.Rejected // Hoặc bạn có thể sử dụng một trạng thái khác như 'deleted'
      });
      
      toast.success('Đã xóa lịch làm việc thành công!');
      setDeleteDialogOpen(false);
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra!');
    }
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
    
    const schedules = data?.data || [];
    
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
                          onClick={() => handleEditSchedule(schedule)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
                        
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
        <Button onClick={handleAddSchedule} className="flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          Thêm lịch làm việc
        </Button>
      </div>
      
      {/* Schedule list */}
      {renderScheduleList()}
      
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn ngày:</label>
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => setSelectedDate(date ? date.toISOString().split('T')[0] : '')}
                disabled={(date: Date) => isPastDate(date)}
                className="rounded-md border"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn ca làm việc:</label>
              <Select
                value={selectedShift}
                onValueChange={(value) => setSelectedShift(value as ShiftType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ca làm việc" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ShiftType.Morning}>{shiftTypeToText(ShiftType.Morning)}</SelectItem>
                  <SelectItem value={ShiftType.Afternoon}>{shiftTypeToText(ShiftType.Afternoon)}</SelectItem>
                  <SelectItem value={ShiftType.Evening}>{shiftTypeToText(ShiftType.Evening)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú (không bắt buộc):</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Thêm ghi chú nếu cần..."
                className="min-h-[80px]"
              />
            </div>
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
      
      {/* Delete confirmedation dialog */}
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
              disabled={editScheduleMutation.isPending}
            >
              {editScheduleMutation.isPending ? (
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
    </div>
  );
};