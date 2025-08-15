import React, { useEffect, useState } from 'react';
import { Calendar, User, FileText, Eye, Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { Pagination } from '../ui/Pagination';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useAuth } from '../../hooks/useAuth';
import { isAppointmentCancellable } from '../../utils/appointmentUtils';
import type { AppointmentDTO } from '../../types/appointment';
import { useForm } from "react-hook-form";
import TreatmentModal from '../patient/TreatmentModal';
import type { TreatmentFormData } from "@/types/treatment";
import { formatDateVN, formatTimeVN } from '../../utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import { useChangeAppointmentStatus } from '../../hooks/useAppointments';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';
import { useNavigate } from 'react-router';

interface AppointmentListViewProps {
  appointments: AppointmentDTO[];
  onAppointmentClick?: (appointment: AppointmentDTO) => void;
}

export const AppointmentListView: React.FC<AppointmentListViewProps> = ({
  appointments
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['all']);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5); // Make it configurable
  const [lastUserId, setLastUserId] = useState<string | null>(null);
  const { role, userId } = useAuth();
  const queryClient = useQueryClient();

  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    appointmentId: number | null;
    status: 'attended' | 'absented' | null;
    patientName: string;
  }>({
    isOpen: false,
    appointmentId: null,
    status: null,
    patientName: ''
  });

  const treatmentFormMethods = useForm<TreatmentFormData>();
  const [treatmentToday, setTreatmentToday] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { mutate: changeStatus, isPending: isChangingStatus } = useChangeAppointmentStatus();
  useEffect(() => {
    if (userId) {
      if (lastUserId && lastUserId !== userId) {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
      }
      setLastUserId(userId);
    }
  }, [userId, queryClient, lastUserId]);


  const getStatusText = (
    status: 'confirmed' | 'canceled' | 'attended' | 'absented'
  ) => {
    switch (status) {
      case 'confirmed':
        return 'Đã xác nhận';
      case 'canceled':
        return 'Đã hủy';
      case 'attended':
        return 'Đã đến';
      case 'absented':
        return 'Vắng';
      default:
        return status;
    }
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.dentistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointmentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter.includes('all') || statusFilter.includes(appointment.status);
    return matchesSearch && matchesStatus;
  });
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    try {
      const dateOnlyA = a.appointmentDate.split('T')[0];
      const timeOnlyA = a.appointmentTime.split('.')[0];
      const dateOnlyB = b.appointmentDate.split('T')[0];
      const timeOnlyB = b.appointmentTime.split('.')[0];

      let dateA = new Date(`${dateOnlyA}T${timeOnlyA}`);
      let dateB = new Date(`${dateOnlyB}T${timeOnlyB}`);

      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        const [yearA, monthA, dayA] = dateOnlyA.split('-').map(Number);
        const [hourA, minuteA, secondA = 0] = timeOnlyA.split(':').map(Number);
        dateA = new Date(yearA, monthA - 1, dayA, hourA, minuteA, secondA);

        const [yearB, monthB, dayB] = dateOnlyB.split('-').map(Number);
        const [hourB, minuteB, secondB = 0] = timeOnlyB.split(':').map(Number);
        dateB = new Date(yearB, monthB - 1, dayB, hourB, minuteB, secondB);
      }

      const now = new Date();
      const isAFuture = dateA >= now;
      const isBFuture = dateB >= now;
      if (isAFuture && !isBFuture) return -1;
      if (!isAFuture && isBFuture) return 1;
      return Math.abs(dateA.getTime() - now.getTime()) - Math.abs(dateB.getTime() - now.getTime());
    } catch (error) {
      console.error('Error sorting appointments:', error, { a, b });
      return 0;
    }
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex);
 
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (showTreatmentModal && selectedAppointmentId !== null) {
      treatmentFormMethods.setValue("appointmentID", selectedAppointmentId);
    }
  }, [showTreatmentModal, selectedAppointmentId, treatmentFormMethods]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };


  const handleStatusFilterChange = (value: string) => {
    if (value === 'all') {
      setStatusFilter(['all']);
    } else {
      setStatusFilter(prev => {
        const newFilter = prev.filter(item => item !== 'all');
        if (newFilter.includes(value)) {
          const updated = newFilter.filter(item => item !== value);
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...newFilter, value];
        }
      });
    }
  };

  const handleStatusChangeRequest = (appointmentId: number, newStatus: 'attended' | 'absented', patientName: string) => {
    setConfirmModal({
      isOpen: true,
      appointmentId,
      status: newStatus,
      patientName
    });
  };

  const handleConfirmStatusChange = () => {
    if (!confirmModal.appointmentId || !confirmModal.status) return;
    
    changeStatus(
      { appointmentId: confirmModal.appointmentId, status: confirmModal.status },
      {
        onSuccess: () => {
          toast.success(`Đã cập nhật trạng thái thành công`);
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          setConfirmModal({ isOpen: false, appointmentId: null, status: null, patientName: '' });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật trạng thái');
          setConfirmModal({ isOpen: false, appointmentId: null, status: null, patientName: '' });
        }
      }
    );
  };


  const confirmedCount = filteredAppointments.filter(a => a.status === 'confirmed').length;
  const cancelledCount = filteredAppointments.filter(a => a.status === 'canceled').length;
  const attendedCount = filteredAppointments.filter(a => a.status === 'attended').length;
  const absentedCount = filteredAppointments.filter(a => a.status === 'absented').length;
  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl">Danh sách lịch hẹn</CardTitle>
          <CardDescription>
            Quản lý và theo dõi các cuộc hẹn của bệnh nhân
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-yellow-500 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">Tổng lịch hẹn</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">{filteredAppointments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Đã xác nhận</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{confirmedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-red-500 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-red-700 truncate">Đã hủy</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-900">{cancelledCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-blue-400 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">Đã đến</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{attendedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 col-span-2 md:col-span-1">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-1.5 sm:p-2 bg-gray-500 rounded-lg flex-shrink-0">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">Vắng</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{absentedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm theo tên bệnh nhân, bác sĩ hoặc loại hẹn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${showFilters ? "bg-blue-50 text-blue-700" : ""}`}
              >
                <Filter className="h-4 w-4" />
                Bộ lọc
              </Button>
            </div>

            {/* Expandable Filter Panel */}
            {showFilters && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Trạng thái</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-all"
                        checked={statusFilter.includes('all')}
                        onCheckedChange={() => handleStatusFilterChange('all')}
                      />
                      <label htmlFor="status-all" className="text-sm font-medium">
                        Tất cả
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-confirmed"
                        checked={statusFilter.includes('confirmed')}
                        onCheckedChange={() => handleStatusFilterChange('confirmed')}
                      />
                      <label htmlFor="status-confirmed" className="text-sm">
                        Đã xác nhận
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-canceled"
                        checked={statusFilter.includes('canceled')}
                        onCheckedChange={() => handleStatusFilterChange('canceled')}
                      />
                      <label htmlFor="status-canceled" className="text-sm">
                        Đã hủy
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-attended"
                        checked={statusFilter.includes('attended')}
                        onCheckedChange={() => handleStatusFilterChange('attended')}
                      />
                      <label htmlFor="status-attended" className="text-sm">
                        Đã đến
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="status-absented"
                        checked={statusFilter.includes('absented')}
                        onCheckedChange={() => handleStatusFilterChange('absented')}
                      />
                      <label htmlFor="status-absented" className="text-sm">
                        Vắng
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        {paginatedAppointments.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Không có lịch hẹn nào phù hợp</p>
          </Card>
        ) : (
          paginatedAppointments.map((appointment) => (
            <Card key={appointment.appointmentId} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={
                        appointment.status === 'confirmed'
                          ? 'success'
                          : appointment.status === 'canceled'
                            ? 'destructive'
                            : appointment.status === 'attended'
                              ? 'info'
                              : 'secondary'
                      }
                      className="text-xs font-medium"
                    >
                      {getStatusText(appointment.status)}
                    </Badge>
                    {appointment.isNewPatient && (
                      <Badge variant="info" className="text-xs font-medium">
                        Bệnh nhân mới
                      </Badge>
                    )}

                    {appointment.isExistPrescription && (
                      <Badge variant="success" className="text-xs font-medium">
                        Có đơn thuốc
                      </Badge>
                    )}
                    {/* Show cancellation warning for Patient */}
                    {role === 'Patient' && appointment.status === 'confirmed' &&
                      !isAppointmentCancellable(appointment.appointmentDate, appointment.appointmentTime) && (
                        <Badge variant="warning" className="text-xs font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Không thể hủy
                        </Badge>
                      )}
                  </div>
                  
                  {/* Action buttons*/}
                  <div className="flex flex-wrap gap-2 w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (role === 'Patient') {
                          navigate(`/patient/appointments/${appointment.appointmentId}`);
                        } else {
                          navigate(`/appointments/${appointment.appointmentId}`);
                        }
                      }}
                      className="flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Eye className="h-4 w-4 flex-shrink-0" />
                      <span>Chi tiết</span>
                    </Button>
                
                    {role === 'Receptionist' && appointment.status === 'confirmed' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleStatusChangeRequest(appointment.appointmentId, 'attended', appointment.patientName)}
                          disabled={isChangingStatus}
                          className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            <span className="hidden xs:inline">Đã đến</span>
                            <span className="xs:hidden">Đến</span>
                          </span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChangeRequest(appointment.appointmentId, 'absented', appointment.patientName)}
                          disabled={isChangingStatus}
                          className="flex items-center justify-center gap-1 text-red-600 hover:text-red-700 border-red-300"
                        >
                          <XCircle className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">
                            <span className="hidden xs:inline">Vắng</span>
                            <span className="xs:hidden">Vắng</span>
                          </span>
                        </Button>
                      </>
                    )}
                    
                    {role === 'Dentist' && appointment.status !== 'canceled' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedAppointmentId(appointment.appointmentId);
                          setShowTreatmentModal(true);
                          setTreatmentToday(false);
                        }}
                        className="flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <FileText className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          <span className="hidden md:inline">Tạo hồ sơ điều trị</span>
                          <span className="md:hidden">Tạo hồ sơ</span>
                        </span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Bệnh nhân</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{appointment.patientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg flex-shrink-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Bác sĩ</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{appointment.dentistName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Ngày & Giờ</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {formatDateVN(appointment.appointmentDate)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {formatTimeVN(appointment.appointmentTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 font-medium">Loại hẹn</p>
                      <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {appointment.appointmentType === 'follow-up'
                          ? 'Tái khám'
                          : appointment.appointmentType === 'consult'
                            ? 'Tư vấn'
                            : appointment.appointmentType === 'treatment'
                              ? 'Điều trị'
                              : appointment.appointmentType === 'first-time'
                                ? 'Khám lần đầu '
                                : appointment.appointmentType}
                      </p>
                    </div>
                  </div>
                </div>

                {appointment.content && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                    <p className="text-sm text-gray-700 line-clamp-2 font-bold">{appointment.content}</p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Tạo lúc: {formatDateVN(appointment.createdAt)}
                    {appointment.updatedAt && (
                      <span> • Cập nhật: {formatDateVN(appointment.updatedAt)}</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        
        {/* Pagination */}
      {sortedAppointments.length > 0 && (
        <Card className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={sortedAppointments.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </Card>
      )}
      <TreatmentModal
        formMethods={treatmentFormMethods}
        isOpen={showTreatmentModal}
        isEditing={false}
        onClose={() => setShowTreatmentModal(false)}
        updatedBy={Number(userId)}
        appointmentId={selectedAppointmentId ?? undefined}
        treatmentToday={treatmentToday ?? undefined}
        defaultStatus="in-progress"
        onSubmit={() => {
          setShowTreatmentModal(false);
        }}
        patientId={selectedAppointmentId ? Number(appointments.find(a => a.appointmentId === selectedAppointmentId)?.patientId) : undefined}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, appointmentId: null, status: null, patientName: '' })}
        onConfirm={handleConfirmStatusChange}
        title={`Xác nhận ${confirmModal.status === 'attended' ? 'đã đến' : 'vắng mặt'}`}
        message={`Bạn có chắc chắn muốn đánh dấu bệnh nhân ${confirmModal.patientName} là "${confirmModal.status === 'attended' ? 'đã đến' : 'vắng mặt'}"?`}
        confirmText={confirmModal.status === 'attended' ? 'Xác nhận đã đến' : 'Xác nhận vắng mặt'}
        confirmVariant={confirmModal.status === 'attended' ? 'default' : 'destructive'}
        isLoading={isChangingStatus}
      />
    </div>
  );
};