import React, { useState } from 'react';
import { X, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useCancelAppointment } from '../../hooks/useCancelAppointment';
import { getTimeUntilAppointment } from '../../utils/appointmentUtils';
import type { AppointmentDTO } from '../../types/appointment';
import { formatDateVN, formatTimeVN } from '../../utils/dateUtils';

interface CancelAppointmentDialogProps {
  appointment: AppointmentDTO;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CancelAppointmentDialog: React.FC<CancelAppointmentDialogProps> = ({
  appointment,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelAppointment();

  if (!isOpen) return null;

  const timeUntilAppointment = getTimeUntilAppointment(appointment.appointmentDate, appointment.appointmentTime);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync({
        appointmentId: appointment.appointmentId,
        reason: reason.trim() || undefined
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Cancel appointment error:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md mx-4">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-bold text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Hủy lịch hẹn
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Lịch hẹn</span>
                <Badge variant="info">
                  {appointment.isNewPatient ? 'Bệnh nhân mới' : 'Tái khám'}
                </Badge>
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Bác sĩ:</span> {appointment.dentistName}</p>
                <p><span className="font-medium">Ngày:</span> {formatDateVN(appointment.appointmentDate)}</p>
                <p><span className="font-medium">Giờ:</span> {formatTimeVN(appointment.appointmentTime)}</p>
                <p><span className="font-medium">Loại hẹn: </span>{appointment.appointmentType === 'follow-up'
                  ? 'Tái khám'
                  : appointment.appointmentType === 'consultation'
                    ? 'Tư vấn'
                    : appointment.appointmentType === 'treatment'
                      ? 'Điều trị'
                      : appointment.appointmentType === 'first-time'
                        ? 'Khám lần đầu '
                        : appointment.appointmentType}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">{timeUntilAppointment}</span>
                </div>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Lưu ý khi hủy lịch hẹn:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Lịch hẹn đã hủy không thể khôi phục</li>
                    <li>Bạn có thể đặt lịch hẹn mới sau khi hủy</li>
                    <li>Vui lòng hủy trước ít nhất 2 giờ so với giờ hẹn</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do hủy (tùy chọn)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{reason.length}/200 ký tự</p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={cancelMutation.isPending}
              >
                Giữ lại lịch hẹn
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancel}
                className="flex-1"
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};