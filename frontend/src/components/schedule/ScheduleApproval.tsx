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

export const ScheduleApproval: React.FC = () => {
  // States
  const [selectedSchedules, setSelectedSchedules] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  
  // Queries
  const { 
    data, 
    isLoading, 
    error 
  } = useAllDentistSchedules();
  
  // Mutations
  const approveMutation = useApproveSchedules();
  
  // Lọc schedules theo trạng thái pending và theo searchTerm nếu có
  const pendingSchedules = React.useMemo(() => {
    if (!data?.data) return [];
    
    return data.data
      .filter((schedule: Schedule) => {
        // Chỉ lấy lịch đang chờ duyệt
        if (schedule.status !== ScheduleStatus.Pending) return false;
        
        // Lọc theo searchTerm nếu có
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const dentistName = schedule.dentistName?.toLowerCase() || '';
          const date = formatDateWithDay(schedule.date).toLowerCase();
          
          return dentistName.includes(term) || date.includes(term);
        }
        
        return true;
      })
      .sort((a: Schedule, b: Schedule) => {
        // Sắp xếp theo ngày, mới nhất lên đầu
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [data, searchTerm]);
  
  // Handlers
  const handleSelectAll = () => {
    if (selectedSchedules.length === pendingSchedules.length) {
      // Nếu đã chọn tất cả, bỏ chọn tất cả
      setSelectedSchedules([]);
    } else {
      // Nếu chưa chọn tất cả, chọn tất cả
    setSelectedSchedules(pendingSchedules.map((schedule: Schedule) => schedule.id as number));
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
    
    setApprovalAction('approve');
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
      
      {/* Search and Action buttons */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Tìm kiếm theo tên bác sĩ hoặc ngày..."
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={selectedSchedules.length === 0 || approveMutation.isPending}
            onClick={openRejectDialog}
          >
            {approveMutation.isPending && approvalAction === 'reject' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Từ chối ({selectedSchedules.length})
          </Button>
          
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={selectedSchedules.length === 0 || approveMutation.isPending}
            onClick={openApproveDialog}
          >
            {approveMutation.isPending && approvalAction === 'approve' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Phê duyệt ({selectedSchedules.length})
          </Button>
        </div>
      </div>
      
      {/* Pending Schedule List */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <div className="flex items-center">
                  <Checkbox
                    checked={
                      pendingSchedules.length > 0 && 
                      selectedSchedules.length === pendingSchedules.length
                    }
                    onCheckedChange={handleSelectAll}
                    id="select-all"
                  />
                  <label 
                    htmlFor="select-all" 
                    className="ml-2 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Chọn tất cả
                  </label>
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bác sĩ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ca làm việc
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingSchedules.map((schedule: Schedule) => (
              <tr key={schedule.id} className={selectedSchedules.includes(schedule.id as number) ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Checkbox
                    checked={selectedSchedules.includes(schedule.id as number)}
                    onCheckedChange={() => handleSelectSchedule(schedule.id as number)}
                    id={`schedule-${schedule.id}`}
                  />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{schedule.dentistName}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDateWithDay(schedule.date)}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{shiftTypeToText(schedule.shift as ShiftType)}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Chờ duyệt</Badge>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{schedule.note || '—'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Xác nhận phê duyệt' : 'Xác nhận từ chối'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve' 
                ? `Bạn có chắc chắn muốn phê duyệt ${selectedSchedules.length} lịch làm việc đã chọn?`
                : `Bạn có chắc chắn muốn từ chối ${selectedSchedules.length} lịch làm việc đã chọn?`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {approvalAction === 'approve' 
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
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
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
                  {approvalAction === 'approve' ? (
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