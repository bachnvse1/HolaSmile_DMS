import { Calendar, CheckCircle, ArrowLeft, Award, Clock } from 'lucide-react';
import { AppointmentStep1 } from './AppointmentStep1';
import { DoctorCard } from './DoctorCard';
import { ScheduleCalendar } from './ScheduleCalendar';
import { useAppointmentForm } from '../../hooks/useAppointmentForm';
import { useDoctorSchedule } from '../../hooks/useDoctorSchedule';
import { TIME_SLOTS } from '../../constants/appointment';
import type { TimeSlot } from '../../types/appointment';

export const BookAppointmentForm = () => {
  const {
    currentStep,
    step1Data,
    selectedDoctor,
    selectedDate,
    selectedTimeSlot,
    currentWeek,
    isSubmitted,
    form,
    setCurrentStep,
    setSelectedDate,
    setSelectedTimeSlot,
    onStep1Submit,
    onFinalSubmit,
    resetForm,
    selectDoctor,
    goToPreviousWeek,
    goToNextWeek,
  } = useAppointmentForm();

  const { doctors } = useDoctorSchedule();

  const handleDateSelect = (date: string, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
  };

  // Tạo time slots với icon cho hiển thị
  const timeSlotsWithIcons: TimeSlot[] = TIME_SLOTS.map(slot => ({
    ...slot,
    icon: <Clock className="h-4 w-4" />
  }));

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Đặt Lịch Thành Công!
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 text-left">
            <h4 className="font-semibold text-gray-900 mb-3">Thông tin lịch hẹn:</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Bác sĩ:</span> {selectedDoctor?.name}</p>
              <p><span className="font-medium text-gray-700">Ngày:</span> {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
              <p><span className="font-medium text-gray-700">Ca làm việc:</span> {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.label}</p>
              <p><span className="font-medium text-gray-700">Thời gian:</span> {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.timeRange}</p>
            </div>
          </div>
          <p className="text-gray-600 mb-8">
            Chúng tôi sẽ liên hệ xác nhận lịch hẹn qua số điện thoại <strong>{step1Data?.phoneNumber}</strong> trong vòng 24 giờ.
          </p>
          <button
            onClick={resetForm}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Đặt Lịch Khác
          </button>
        </div>
      </div>
    );
  }

  if (currentStep === 1) {
    return <AppointmentStep1 form={form} onSubmit={onStep1Submit} />;
  }

  // Step 2: Doctor and Schedule Selection
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Chọn Bác Sĩ & Lịch Hẹn
          </h2>
          <p className="text-gray-600">
            Bước 2/2: Chọn bác sĩ và thời gian phù hợp
          </p>
        </div>

        {/* Doctor Selection */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Award className="h-6 w-6 mr-2 text-blue-600" />
            Chọn Bác Sĩ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                isSelected={selectedDoctor?.id === doctor.id}
                onSelect={selectDoctor}
              />
            ))}
          </div>
        </div>

        {/* Schedule Calendar */}
        {selectedDoctor && (
          <ScheduleCalendar
            doctor={selectedDoctor}
            currentWeek={currentWeek}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onDateSelect={handleDateSelect}
            onPreviousWeek={goToPreviousWeek}
            onNextWeek={goToNextWeek}
          />
        )}

        {/* Selected Info */}
        {selectedDoctor && selectedDate && selectedTimeSlot && (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Thông tin đã chọn:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <span className="text-sm font-medium text-gray-600">Bác sĩ:</span>
                <p className="font-semibold text-gray-900">{selectedDoctor.name}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <span className="text-sm font-medium text-gray-600">Ngày:</span>
                <p className="font-semibold text-gray-900">{new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100">
                <span className="text-sm font-medium text-gray-600">Ca làm việc:</span>
                <p className="font-semibold text-gray-900">
                  {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.label} 
                  ({timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.timeRange})
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentStep(1)}
            className="flex items-center px-8 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay Lại
          </button>

          {selectedDoctor && selectedDate && selectedTimeSlot && (
            <button
              onClick={onFinalSubmit}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Xác Nhận Đặt Lịch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};