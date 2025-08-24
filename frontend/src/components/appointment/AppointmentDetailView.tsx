import React, { useState } from 'react';
import { Calendar, Clock, User, FileText, Tag, UserCheck, CheckCircle, XCircle, AlertTriangle, Plus, Edit as EditIcon, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ConfirmModal } from '../ui/ConfirmModal';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import { PrescriptionModal } from './PrescriptionModal';
import { InstructionCard } from '../instruction/InstructionCard'; 
import { useAuth } from '../../hooks/useAuth';
import { usePrescriptionByAppointment } from '../../hooks/usePrescription';
import { useAppointmentDetail, useChangeAppointmentStatus } from '../../hooks/useAppointments';
import { useDentistSchedule } from '../../hooks/useDentistSchedule';
import { isAppointmentCancellable, getTimeUntilAppointment } from '../../utils/appointmentUtils';
import { Link, useNavigate } from 'react-router';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import { formatDateVN, formatTimeVN } from '../../utils/dateUtils';
import { useQueryClient } from '@tanstack/react-query';
import TreatmentModal from '../patient/TreatmentModal';
import type { TreatmentFormData } from '@/types/treatment';
import { useForm } from 'react-hook-form';
import { useUserInfo } from '@/hooks/useUserInfo';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';

interface AppointmentDetailViewProps {
  appointmentId: number;
}

export const AppointmentDetailView: React.FC<AppointmentDetailViewProps> = ({
  appointmentId,
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: 'attended' | 'absented' | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    status: null,
    title: '',
    message: ''
  });

  const userInfo = useUserInfo();
  const { role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const treatmentFormMethods = useForm<TreatmentFormData>({});
  const [treatmentToday, setTreatmentToday] = useState<boolean | null>(null);
  const { data: appointment, isLoading: isAppointmentLoading } = useAppointmentDetail(appointmentId);
  const { dentists } = useDentistSchedule();
  const patientId = appointment?.patientId;
  const { data: prescription, isLoading: isPrescriptionLoading } = usePrescriptionByAppointment(appointmentId);
  const { mutate: changeStatus, isPending: isChangingStatus } = useChangeAppointmentStatus();

  const refreshAppointmentData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['appointment-detail', appointmentId]
      }),
      queryClient.invalidateQueries({
        queryKey: ['prescription-by-appointment', appointmentId]
      }),
      queryClient.invalidateQueries({
        queryKey: ['appointments']
      })
    ]);
  };

  const handleGoBack = () => {
    if (role === 'Patient') {
      navigate(`/patient/appointments`);
    } else {
      navigate('/appointments');
    }
  };

  const handleTreatmentSubmit = () => {
    setShowTreatmentModal(false);
  };

  const handleStatusChangeRequest = (newStatus: 'attended' | 'absented') => {
    const statusText = newStatus === 'attended' ? 'đã đến' : 'vắng mặt';
    const title = `Xác nhận ${statusText}`;
    const message = `Bạn có chắc chắn muốn đánh dấu bệnh nhân ${appointment?.patientName} là "${statusText}"?`;

    setConfirmModal({
      isOpen: true,
      status: newStatus,
      title,
      message
    });
  };

  const handleConfirmStatusChange = () => {
    if (!confirmModal.status) return;

    changeStatus(
      { appointmentId, status: confirmModal.status },
      {
        onSuccess: () => {
          toast.success(`Đã cập nhật trạng thái thành công`);
          refreshAppointmentData();
          setConfirmModal({ isOpen: false, status: null, title: '', message: '' });
        },
        onError: (error) => {
          toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật trạng thái');
          setConfirmModal({ isOpen: false, status: null, title: '', message: '' });
        }
      }
    );
  };

  if (isAppointmentLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="mt-4 text-center text-gray-600">Đang tải thông tin lịch hẹn...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <p className="text-center text-red-600">Không tìm thấy thông tin lịch hẹn</p>
      </div>
    );
  }

  const canCancelAppointment = role === 'Patient' &&
    appointment.status === 'confirmed' &&
    isAppointmentCancellable(appointment.appointmentDate, appointment.appointmentTime);

  const timeUntilAppointment = getTimeUntilAppointment(appointment.appointmentDate, appointment.appointmentTime);

  const getStatusConfig = (
    status: 'confirmed' | 'canceled' | 'attended' | 'absented'
  ) => {
    switch (status) {
      case 'confirmed':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Đã xác nhận'
        };
      case 'canceled':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Đã hủy'
        };
      case 'attended':
        return {
          icon: <UserCheck className="h-4 w-4" />,
          text: 'Đã đến'
        };
      case 'absented':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          text: 'Vắng'
        };
      default:
        return { icon: null, text: status };
    }
  };

  const statusConfig = getStatusConfig(appointment.status);

  return (
    <div className="container mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className='border border-gray-300'>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chi Tiết Lịch Hẹn</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Thông tin chi tiết về lịch hẹn #{appointment.appointmentId}</p>
          </div>
        </div>

        {/* Action Buttons*/}
        <div className="flex items-center gap-2 sm:gap-3">
          {role === 'Dentist' && appointment.status !== "canceled" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowTreatmentModal(true);
                setTreatmentToday(false);
              }}
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Tạo hồ sơ điều trị</span>
              <span className="sm:hidden">Hồ sơ</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Appointment Content */}
          <div className="p-6 space-y-6 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
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
                className="flex items-center space-x-2"
              >
                {statusConfig.icon}
                <span>{statusConfig.text}</span>
              </Badge>
            </div>

            {/* Patient & Dentist Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <User className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Bệnh nhân</p>
                  <Link to={`/patient/${patientId}`} className="font-semibold text-gray-900">{appointment.patientName}</Link>
                  {appointment.isNewPatient && (
                    <div className="flex items-center mt-2">
                      <UserCheck className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-600 font-medium">Bệnh nhân mới</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <User className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Bác sĩ phụ trách</p>
                  <p className="font-semibold text-gray-900">{appointment.dentistName}</p>
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Ngày hẹn</p>
                  <p className="font-semibold text-gray-900">{formatDateVN(appointment.appointmentDate)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Giờ hẹn</p>
                  <p className="font-semibold text-gray-900">{formatTimeVN(appointment.appointmentTime)}</p>
                  {role === 'Patient' && appointment.status === 'confirmed' && (
                    <p className={`text-xs mt-1 ${canCancelAppointment ? 'text-green-600' : 'text-red-600'}`}>
                      {timeUntilAppointment}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Appointment Type */}
            <div className="flex items-start">
              <Tag className="h-5 w-5 text-indigo-600 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-600">Loại hẹn</p>
                <p className="font-semibold text-gray-900">
                  {appointment.appointmentType === 'follow-up'
                    ? 'Tái khám'
                    : appointment.appointmentType === 'consultation'
                      ? 'Tư vấn'
                      : appointment.appointmentType === 'treatment'
                        ? 'Điều trị'
                        : appointment.appointmentType === 'first-time'
                          ? 'Khám lần đầu'
                          : appointment.appointmentType}
                </p>
              </div>
            </div>

            {/* Content */}
            {appointment.content && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-600 mr-3 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">Nội dung khám</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 font-bold whitespace-pre-wrap break-words word-wrap overflow-wrap-anywhere ">{appointment.content}</p>
                  </div>
                </div>
              </div>
            )}

            {appointment.status === 'canceled' && appointment.cancelReason && (
              <div className="flex items-start">
                <XCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-2">Lý do hủy lịch khám</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap break-words word-wrap overflow-wrap-anywhere">{appointment.cancelReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Ngày tạo:</span>
                    <span className="text-gray-900">{formatDateVN(appointment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạo bởi:</span>
                    <span className="text-gray-900">{appointment.createdBy || 'Hệ thống'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cập nhật:</span>
                    <span className="text-gray-900">{formatDateVN(appointment.updatedAt || appointment.createdAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cập nhật bởi:</span>
                    <span className="text-gray-900">{appointment.updatedBy || 'Chưa có'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Receptionist */}
            {role === 'Receptionist' && appointment.status === 'confirmed' && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Thao tác</h4>
                <div className="flex flex-wrap gap-3 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeRequest('attended')}
                    disabled={isChangingStatus}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isChangingStatus ? 'Đang cập nhật...' : 'Đánh dấu đã đến'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChangeRequest('absented')}
                    disabled={isChangingStatus}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4" />
                    {isChangingStatus ? 'Đang cập nhật...' : 'Đánh dấu vắng mặt'}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowEditDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <EditIcon className="h-4 w-4" />
                    Cập nhật lịch hẹn
                  </Button>
                </div>
              </div>
            )}
            {canCancelAppointment && (
              <div className="flex flex-wrap justify-end">
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className='text-white'
              >
                Hủy lịch hẹn
              </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Prescription and Instructions */}
        <div className="space-y-6">
          {/* Prescription Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-lg text-gray-900">Đơn thuốc</h3>
              {role === 'Dentist' && (
                <Button
                  variant={appointment.isExistPrescription ? "outline" : "default"}
                  size="sm"
                  onClick={() => setShowPrescriptionModal(true)}
                  className="flex items-center gap-2"
                  disabled={isPrescriptionLoading}
                >
                  {isPrescriptionLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      <span>Đang tải...</span>
                    </>
                  ) : appointment.isExistPrescription ? (
                    <>
                      <EditIcon className="h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Thêm đơn thuốc</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="p-4">
              {isPrescriptionLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600 text-sm">Đang tải đơn thuốc...</p>
                  </div>
                </div>
              ) : prescription ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap text-sm leading-relaxed">{prescription.content}</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Tạo bởi: {prescription.createdBy}</span>
                    <span>Ngày tạo: {formatDateVN(prescription.createdAt)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center text-gray-500">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium">Chưa có đơn thuốc</p>
                    <p className="text-sm">Chưa có đơn thuốc cho lịch hẹn này</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instruction Card */}
          <InstructionCard 
            appointmentId={appointmentId}
            appointmentStatus={appointment.status}
          />
        </div>
      </div>

      {role === 'Patient' && appointment.status === 'confirmed' && !canCancelAppointment && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Không thể hủy lịch hẹn (dưới 2 giờ hoặc đã qua thời gian hẹn)
            </p>
          </div>
        </div>
      )}

      {/* Cancel Appointment Dialog */}
      {showCancelDialog && (
        <CancelAppointmentDialog
          appointment={appointment}
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            setShowCancelDialog(false);
            refreshAppointmentData();
          }}
        />
      )}

      {/* Edit Appointment Dialog */}
      {showEditDialog && (
        <EditAppointmentDialog
          appointment={appointment}
          isOpen={showEditDialog}
          dentists={dentists}
          onClose={() => setShowEditDialog(false)}
          onSuccess={() => {
            setShowEditDialog(false);
            refreshAppointmentData();
          }}
        />
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <PrescriptionModal
          appointmentId={appointmentId}
          isOpen={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          onSuccess={() => {
            setShowPrescriptionModal(false);
            refreshAppointmentData();
            window.location.reload();
          }}
        />
      )}

      {/* Treatment Modal */}
      {showTreatmentModal && (
        <TreatmentModal
          formMethods={treatmentFormMethods}
          isOpen={showTreatmentModal}
          isEditing={false}
          treatmentToday={treatmentToday ?? undefined}
          onClose={() => setShowTreatmentModal(false)}
          updatedBy={Number(userInfo.id)}
          appointmentId={appointmentId}
          defaultStatus="in-progress"
          onSubmit={handleTreatmentSubmit}
          patientId={Number(appointment.patientId)}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, status: null, title: '', message: '' })}
        onConfirm={handleConfirmStatusChange}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.status === 'attended' ? 'Xác nhận đã đến' : 'Xác nhận vắng mặt'}
        confirmVariant={confirmModal.status === 'attended' ? 'default' : 'destructive'}
        isLoading={isChangingStatus}
      />
    </div>

  );
};