import React, { useEffect, useState } from 'react';
import { Calendar, User, FileText, Eye, Search, Filter, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Pagination } from '../ui/Pagination';
import { useAuth } from '../../hooks/useAuth';
import { isAppointmentCancellable } from '../../utils/appointmentUtils';
import type { AppointmentDTO } from '../../types/appointment';
import { useForm } from "react-hook-form";
import TreatmentModal from '../patient/TreatmentModal';
import type { TreatmentFormData } from "@/types/treatment";

interface AppointmentListViewProps {
  appointments: AppointmentDTO[];
  onAppointmentClick?: (appointment: AppointmentDTO) => void;
}

export const AppointmentListView: React.FC<AppointmentListViewProps> = ({
  appointments,
  onAppointmentClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'canceled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { role } = useAuth();

  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  const treatmentFormMethods = useForm<TreatmentFormData>();
  const [treatmentToday, setTreatmentToday] = useState<boolean | null>(null);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  // Filter appointments
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch =
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.dentistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointmentType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort appointments by date and time - nearest to current time first
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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, itemsPerPage]);

  useEffect(() => {
    if (showTreatmentModal && selectedAppointmentId !== null) {
      treatmentFormMethods.setValue("appointmentID", selectedAppointmentId);
    }
  }, [showTreatmentModal, selectedAppointmentId, treatmentFormMethods]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Handle treatment modal opening
  const handleOpenTreatmentModal = (appointment: AppointmentDTO) => {
    setSelectedAppointmentId(appointment.appointmentId);
    setSelectedPatientId(appointment.patientId||null); // Assuming patientId exists in AppointmentDTO
    setShowTreatmentModal(true);
    setTreatmentToday(false);
  };

  // Group appointments by status for summary
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Tổng lịch hẹn</p>
                    <p className="text-2xl font-bold text-yellow-900">{filteredAppointments.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700">Đã xác nhận</p>
                    <p className="text-2xl font-bold text-green-900">{confirmedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-700">Đã hủy</p>
                    <p className="text-2xl font-bold text-red-900">{cancelledCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-400 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">Đã đến</p>
                    <p className="text-2xl font-bold text-blue-900">{attendedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Vắng</p>
                    <p className="text-2xl font-bold text-gray-900">{absentedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
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

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'confirmed' | 'canceled')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                title="Lọc theo trạng thái"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="canceled">Đã hủy</option>
                <option value="attended">Đã đến</option>
                <option value="absented">Vắng</option>
              </select>
            </div>
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
                    {/* Show cancellation warning for Patient */}
                    {role === 'Patient' && appointment.status === 'confirmed' &&
                      !isAppointmentCancellable(appointment.appointmentDate, appointment.appointmentTime) && (
                        <Badge variant="warning" className="text-xs font-medium flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Không thể hủy
                        </Badge>
                      )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onAppointmentClick?.(appointment)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Chi tiết
                    </Button>
                    {role === 'Dentist' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenTreatmentModal(appointment)}
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Tạo hồ sơ điều trị
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Bệnh nhân</p>
                      <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Bác sĩ</p>
                      <p className="font-semibold text-gray-900">{appointment.dentistName}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Ngày & Giờ</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(appointment.appointmentDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatTime(appointment.appointmentTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Loại hẹn</p>
                      <p className="font-semibold text-gray-900">
                        {appointment.appointmentType === 'follow-up'
                          ? 'Tái khám'
                          : appointment.appointmentType === 'consult'
                            ? 'Tư vấn'
                            : appointment.appointmentType === 'treatment'
                              ? 'Điều trị'
                              : appointment.appointmentType === 'first-time'
                                ? 'Khám lần đầu'
                                : appointment.appointmentType}
                      </p>

                    </div>
                  </div>

                {appointment.content && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-200">
                    <p className="text-sm text-gray-700 line-clamp-2">{appointment.content}</p>

                  </div>
                )}

                {/* Timestamp */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Tạo lúc: {formatDate(appointment.createdAt)}
                    {appointment.updatedAt && (
                      <span> • Cập nhật: {formatDate(appointment.updatedAt)}</span>
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
        updatedBy={0}
        appointmentId={selectedAppointmentId ?? undefined}
        treatmentToday={treatmentToday ?? undefined}
        defaultStatus="in-progress"
        onSubmit={() => {
          setShowTreatmentModal(false);
        }}
        patientId={selectedPatientId ?? undefined}
      />
    </div>
  );
};