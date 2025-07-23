import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DentistSelector } from './DentistSelector';
import { ScheduleCalendar } from './ScheduleCalendar';
import { SelectedAppointmentInfo } from './SelectedAppointmentInfo';
import axiosInstance from '@/lib/axios';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';
import type { Dentist, AppointmentDTO } from '../../types/appointment';

interface EditAppointmentDialogProps {
  appointment: AppointmentDTO;
  dentists: Dentist[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditAppointmentDialog: React.FC<EditAppointmentDialogProps> = ({
  appointment,
  dentists,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(
    dentists.find(d => d.name === appointment.dentistName) || null
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    appointment.appointmentDate.split('T')[0]
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [reason, setReason] = useState(appointment.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  // Xác định ca làm việc từ giờ
  React.useEffect(() => {
    if (appointment.appointmentTime) {
      const hour = Number(appointment.appointmentTime.split(':')[0]);
      if (hour < 12) setSelectedTimeSlot('morning');
      else if (hour < 17) setSelectedTimeSlot('afternoon');
      else setSelectedTimeSlot('evening');
    }
  }, [appointment.appointmentTime]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    if (!selectedDentist || !selectedDate || !selectedTimeSlot || !reason.trim()) {
      toast.error('Vui lòng nhập đủ thông tin!');
      return;
    }
    setIsSubmitting(true);
    try {
      let timeString = '08:00:00';
      if (selectedTimeSlot === 'afternoon') timeString = '14:00:00';
      if (selectedTimeSlot === 'evening') timeString = '17:00:00';

      await axiosInstance.put('/appointment/updateAppointment', {
        appointmentId: appointment.appointmentId,
        dentistId: selectedDentist.dentistID,
        appointmentDate: selectedDate,
        appointmentTime: timeString,
        reasonForFollowUp: reason.trim(),
      });
      toast.success('Cập nhật lịch hẹn thành công!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error)|| 'Có lỗi xảy ra!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-opacity-75"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-4xl mx-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-bold flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Cập nhật lịch hẹn
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
          <CardContent className="space-y-4 max-h-[80vh] overflow-y-auto">
            <DentistSelector
              dentists={dentists}
              selectedDentist={selectedDentist}
              onSelect={setSelectedDentist}
            />
            {selectedDentist && (
              <ScheduleCalendar
                dentist={selectedDentist}
                currentWeek={currentWeek}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onDateSelect={(date, slot) => {
                  setSelectedDate(date);
                  setSelectedTimeSlot(slot);
                }}
                onPreviousWeek={() => setCurrentWeek(w => Math.max(0, w - 1))}
                onNextWeek={() => setCurrentWeek(w => w + 1)}
                mode="book"
                canBookAppointment={true}
              />
            )}
            {selectedDentist && selectedDate && selectedTimeSlot && (
              <SelectedAppointmentInfo
                selectedDentist={selectedDentist}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
              />
            )}
            {/* Lý do khám */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do khám <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Nhập lý do khám..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                maxLength={200}
                required
              />
            </div>
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="default"
                onClick={handleUpdate}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};