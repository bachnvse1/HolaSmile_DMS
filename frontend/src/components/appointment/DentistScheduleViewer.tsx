import React, { useState } from 'react';
import { UserX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { DentistSelector } from './DentistSelector';
import { ScheduleCalendar } from './ScheduleCalendar';
import { SelectedAppointmentInfo } from './SelectedAppointmentInfo';
import { useDentistSchedule } from '../../hooks/useDentistSchedule';
import { useBookAppointment } from '../../hooks/useBookAppointment';
import { useBookFUAppointment } from '../../hooks/useBookFUAppointment';
import { toast } from 'react-toastify';
import type { Dentist } from '../../types/appointment';

interface DentistScheduleViewerProps {
  mode: 'view' | 'book'; // view = chỉ xem, book = có thể đặt lịch
  patientId?: number;
  prefilledData?: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    medicalIssue?: string;
  };
}

export const DentistScheduleViewer: React.FC<DentistScheduleViewerProps> = ({
  mode = 'view',
  prefilledData,
  patientId
}) => {
  const { isAuthenticated, role } = useAuth();
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [bookingData, setBookingData] = useState({
    medicalIssue: prefilledData?.medicalIssue || '',
    email: prefilledData?.email || ''
  });

  const { dentists, isLoading, error } = useDentistSchedule();
  const bookAppointmentMutation = useBookAppointment();
  const bookFUAppointmentMutation = useBookFUAppointment();

  const canBookAppointment = mode === 'book' && (!isAuthenticated || role === 'Patient' || role === 'Receptionist');

  const handleDateSelect = (date: string, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
  };

  const handleConfirmInfo = () => {
    setShowBookingForm(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedDentist || !selectedDate || !selectedTimeSlot) return;

    const appointmentDate = new Date(selectedDate);
    let timeString = '08:00:00';

    if (selectedTimeSlot === 'morning') {
      timeString = '08:00:00';
      appointmentDate.setHours(8, 0, 0, 0);
    } else if (selectedTimeSlot === 'afternoon') {
      timeString = '14:00:00';
      appointmentDate.setHours(14, 0, 0, 0);
    } else if (selectedTimeSlot === 'evening') {
      timeString = '17:00:00';
      appointmentDate.setHours(17, 0, 0, 0);
    }

    if (role === "Receptionist" && patientId) {
      const payload = {
        patientId,
        dentistId: selectedDentist.dentistID,
        appointmentDate: appointmentDate.toISOString(),
        appointmentTime: timeString,
        reasonForFollowUp: bookingData.medicalIssue.trim(),
        appointmentType: "follow-up"
      };
      
      bookFUAppointmentMutation.mutate(payload, {
        onSuccess: (response: unknown) => {
          const res = response as { message?: string };
          toast.success(res?.message || 'Đặt lịch tái khám thành công!');
          setShowBookingForm(false);
          setSelectedDate('');
          setSelectedTimeSlot('');
          setBookingData({ medicalIssue: '', email: prefilledData?.email || '' });
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Có lỗi xảy ra khi tạo lịch tái khám');
        }
      });
    } else {
      const payload = {
        FullName: prefilledData?.fullName || '',
        Email: bookingData.email || prefilledData?.email || '',
        PhoneNumber: prefilledData?.phoneNumber || '',
        AppointmentDate: `${appointmentDate.getFullYear()}-${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}-${appointmentDate.getDate().toString().padStart(2, '0')}`,
        AppointmentTime: timeString,
        MedicalIssue: bookingData.medicalIssue.trim(),
        DentistId: selectedDentist.dentistID,
        // Fixed captcha values for authenticated users
        CaptchaValue: "authenticated",
        CaptchaInput: "authenticated"
      };


      bookAppointmentMutation.mutate(payload, {
        onSuccess: (response) => {
          toast.success(response?.message || 'Đặt lịch hẹn thành công!');
          setShowBookingForm(false);
          setSelectedDate('');
          setSelectedTimeSlot('');
          setBookingData({ medicalIssue: '', email: prefilledData?.email || '' });
        },
        onError: (error) => {
          console.error('Error booking appointment:', error);
        }
      });
    };
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Có lỗi xảy ra: {error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'book' ? '' : 'Lịch Làm Việc Nha sĩ'}
        </h2>
        <p className="text-gray-600">
          {mode === 'book'
            ? ''
            : 'Xem lịch làm việc của các Nha sĩ'
          }
        </p>
        {mode === 'book' && !canBookAppointment && (
          <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
            <UserX className="h-4 w-4 mr-1" />
            Chỉ dành cho bệnh nhân, lễ tân hoặc khách
          </div>
        )}
      </div>

      {/* Dentist Selection */}
      <DentistSelector
        dentists={dentists}
        selectedDentist={selectedDentist}
        onSelect={setSelectedDentist}
      />

      {/* Schedule Calendar */}
      {selectedDentist && (
        <ScheduleCalendar
          dentist={selectedDentist}
          currentWeek={currentWeek}
          selectedDate={selectedDate}
          selectedTimeSlot={selectedTimeSlot}
          onDateSelect={handleDateSelect}
          onPreviousWeek={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
          onNextWeek={() => setCurrentWeek(Math.min(1, currentWeek + 1))}
          mode={mode}
          canBookAppointment={canBookAppointment}
        />
      )}      
      {/* Booking Confirmation Section - Using SelectedAppointmentInfo component */}
      {selectedDentist && selectedDate && selectedTimeSlot && canBookAppointment && (
        <>
          <SelectedAppointmentInfo
            selectedDentist={selectedDentist}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
          />

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
                Lịch hẹn sẽ được gửi đến email và số điện thoại của bạn.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTimeSlot('');
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Chọn lại
              </button>
              <button
                onClick={handleConfirmInfo}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Xác nhận đặt lịch
              </button>
            </div>
          </div>
        </>
      )}      
      {/* Booking Form Modal*/}
      {showBookingForm && canBookAppointment && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/20 bg-opacity-50"
            onClick={() => setShowBookingForm(false)}
          ></div>

          {/* Modal content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {role === "Receptionist" ? "Nhập lý do tái khám" : "Hoàn tất thông tin đặt lịch"}
              </h3>

              {role === "Receptionist" ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lý do tái khám: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={bookingData.medicalIssue}
                    onChange={(e) => setBookingData({ ...bookingData, medicalIssue: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Nhập lý do tái khám..."
                    required
                  />
                </div>
              ) : (
                <>
                  {/* Email input if not available */}
                  {/* {!prefilledData?.email && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email của bạn: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={bookingData.email}
                        onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="example@email.com"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email sẽ được dùng để gửi xác nhận lịch hẹn
                      </p>
                    </div>
                  )} */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vấn đề bạn gặp phải: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={bookingData.medicalIssue}
                      onChange={(e) => setBookingData({ ...bookingData, medicalIssue: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Mô tả chi tiết vấn đề nha khoa bạn đang gặp phải..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Thông tin này giúp Nha sĩ chuẩn bị tốt hơn cho buổi khám
                    </p>
                  </div>
                </>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={
                    (role === "Receptionist" ? bookFUAppointmentMutation.isPending : bookAppointmentMutation.isPending) ||
                    !bookingData.medicalIssue.trim() ||
                    (role !== "Receptionist" && !prefilledData?.email && !bookingData.email.trim())
                  }
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(role === "Receptionist" ? bookFUAppointmentMutation.isPending : bookAppointmentMutation.isPending) ? 'Đang đặt lịch...' : 'Đặt lịch ngay'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};