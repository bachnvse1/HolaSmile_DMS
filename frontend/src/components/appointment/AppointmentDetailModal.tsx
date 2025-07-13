import React, { useState } from 'react';
import { X, Calendar, Clock, User, FileText, Tag, UserCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import { useAuth } from '../../hooks/useAuth';
import { isAppointmentCancellable, getTimeUntilAppointment } from '../../utils/appointmentUtils';
import type { Dentist } from '../../types/appointment';
import { Link, useParams, useNavigate } from 'react-router';
import { EditAppointmentDialog } from './EditAppointmentDialog';
import {formatDateVN, formatTimeVN} from '../../utils/dateUtils';

interface AppointmentDetailModalProps {
  appointment: AppointmentDTO | null;
  isOpen: boolean;
  onClose: () => void;
  dentists: Dentist[];
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  appointment,
  isOpen,
  onClose,
  dentists
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { role } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  if (!isOpen || !appointment) return null;

  const canCancelAppointment = role === 'Patient' &&
    appointment.status === 'confirmed' &&
    isAppointmentCancellable(appointment.appointmentDate, appointment.appointmentTime);

  const timeUntilAppointment = getTimeUntilAppointment(appointment.appointmentDate, appointment.appointmentTime);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // "HH:MM"
  };

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
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Chi tiết lịch hẹn
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
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
            {/* Date & Time with Cancellation Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Ngày hẹn</p>
                  <p className="font-semibold text-gray-900">{formatDate(appointment.appointmentDate)}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="h-5 w-5 text-orange-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Giờ hẹn</p>
                  <p className="font-semibold text-gray-900">{formatTime(appointment.appointmentTime)}</p>
                  {role === 'Patient' && appointment.status === 'confirmed' && (
                    <p className={`text-xs mt-1 ${canCancelAppointment ? 'text-green-600' : 'text-red-600'
                      }`}>
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
                          ? 'Khám lần đầu '
                          : appointment.appointmentType}
                </p>
              </div>
            </div>

            {/* Content */}
            {appointment.content && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Nội dung khám</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-900 whitespace-pre-wrap">{appointment.content}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ngày tạo:</span>
                <span className="text-gray-900">{formatDate(appointment.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cập nhật lần cuối:</span>
                <span className="text-gray-900">{formatDate(appointment.updatedAt || appointment.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Warning for non-cancellable appointments */}
          {role === 'Patient' && appointment.status === 'confirmed' && !canCancelAppointment && (
            <div className="flex-1 my-3 mx-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg ">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  Không thể hủy lịch hẹn (dưới 2 giờ hoặc đã qua thời gian hẹn)
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between p-6 border-t border-gray-200">
            {/* Cancel Button for Patient - only show if appointment can be cancelled */}
            {canCancelAppointment && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="flex-1 mr-3"
              >
                Hủy lịch hẹn
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              className='flex-1'
            >
              Đóng
            </Button>

            {role === 'Receptionist' && appointment.status === 'confirmed' && (
              <Button
                variant="default"
                onClick={() => setShowEditDialog(true)}
                className="flex-1 ml-3"
              >
                Cập nhật lịch hẹn
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Appointment Dialog */}
      {showCancelDialog && (
        <CancelAppointmentDialog
          appointment={appointment}
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onSuccess={() => {
            onClose();
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
            onClose();
          }}
        />
      )}
    </div>
  );
};