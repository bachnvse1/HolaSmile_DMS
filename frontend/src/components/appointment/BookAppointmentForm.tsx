import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { AppointmentStep1 } from './AppointmentStep1';
import { ScheduleCalendar } from './ScheduleCalendar';
import { AppointmentSuccess } from './AppointmentSuccess';
import { AppointmentCaptchaStep } from './AppointmentCaptchaStep';
import { DentistSelector } from './DentistSelector';
import { SelectedAppointmentInfo } from './SelectedAppointmentInfo';
import { useDentistSchedule } from '../../hooks/useDentistSchedule';
import { useGuestBookAppointment } from '../../hooks/useBookAppointment';
import { appointmentFormSchema } from '../../lib/validations/appointment';
import { TIME_SLOTS } from '../../constants/appointment';
import type { AppointmentFormData } from '../../lib/validations/appointment';
import type { TimeSlot, Dentist } from '../../types/appointment';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';

export const BookAppointmentForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<AppointmentFormData | null>(null);
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // React Hook Form
  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    mode: 'onChange'
  });

  // React Query hooks
  const { dentists, isLoading: dentistsLoading, error: dentistsError } = useDentistSchedule();
  const bookAppointmentMutation = useGuestBookAppointment();

  // Tạo time slots với icon cho hiển thị
  const timeSlotsWithIcons: TimeSlot[] = TIME_SLOTS.map(slot => ({
    ...slot,
    icon: <Clock className="h-4 w-4" />
  }));

  const onStep1Submit = (data: AppointmentFormData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const resetForm = () => {
    setCurrentStep(1);
    setStep1Data(null);
    setSelectedDentist(null);
    setSelectedDate('');
    setSelectedTimeSlot('');
    setCurrentWeek(0);
    setIsSubmitted(false);
    setError(null);
    setSuccessMessage('');
    form.reset();
  };

  const selectDentist = (dentist: Dentist) => {
    setSelectedDentist(dentist);
    setSelectedDate('');
    setSelectedTimeSlot('');
  };

  const handleDateSelect = (date: string, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
  };

  const goToPreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(0);
    }
  };

  const goToNextWeek = () => {
    if (currentWeek < 1) {
      setCurrentWeek(1);
    }
  };

  const handleScheduleConfirm = () => {
    setCurrentStep(3); // Go to captcha step
  };

  const onFinalSubmit = async (captchaInput: string, captchaValue: string) => {
    if (!step1Data || !selectedDentist || !selectedDate || !selectedTimeSlot) return;
    setError(null);

    // Tạo appointmentDate với đúng format
    const appointmentDate = new Date(selectedDate);

    // Set time based on shift
    if (selectedTimeSlot === 'morning') {
      appointmentDate.setHours(8, 0, 0, 0);
    } else if (selectedTimeSlot === 'afternoon') {
      appointmentDate.setHours(14, 0, 0, 0);
    } else if (selectedTimeSlot === 'evening') {
      appointmentDate.setHours(17, 0, 0, 0);
    }

    // Payload theo format backend - PascalCase field names với captcha
    const payload = {
      FullName: step1Data.fullName.trim(),
      Email: step1Data.email.trim(),
      PhoneNumber: step1Data.phoneNumber.trim(),
      AppointmentDate: appointmentDate.toISOString(),
      AppointmentTime: appointmentDate.getHours() + ':' + appointmentDate.getMinutes().toString().padStart(2, '0') + ':00',
      MedicalIssue: step1Data.medicalIssue.trim(),
      DentistId: selectedDentist.dentistID,
      CaptchaValue: captchaValue,
      CaptchaInput: captchaInput
    };

    bookAppointmentMutation.mutate(payload, {
      onSuccess: (data) => {
        setSuccessMessage(data.message ?? '');
        setIsSubmitted(true);
        toast.success(data.message || 'Đặt lịch thành công!', {
          position: "top-right",
          autoClose: 5000,
        })
      },
      onError: (error) => {
        setError(getErrorMessage(error)|| 'Có lỗi xảy ra khi đặt lịch');
      }
    });
  };

  // Loading state
  if (dentistsLoading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách bác sĩ...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dentistsError) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-4">{dentistsError instanceof Error ? dentistsError.message : String(dentistsError)}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <AppointmentSuccess
        successMessage={successMessage}
        selectedDentist={selectedDentist}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        step1Data={step1Data}
        timeSlotsWithIcons={timeSlotsWithIcons}
        onReset={resetForm}
        error={error}
      />
    );
  }

  // Step 1: Personal information
  if (currentStep === 1) {
    return <AppointmentStep1 form={form} onSubmit={onStep1Submit} />;
  }

  // Step 3: Captcha verification
  if (currentStep === 3) {
    return (
      <AppointmentCaptchaStep
        step1Data={step1Data!}
        selectedDentist={selectedDentist!}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        onBack={() => setCurrentStep(2)}
        onSubmit={onFinalSubmit}
        isLoading={bookAppointmentMutation.isPending}
        error={error || undefined}
      />
    );
  }

  // Step 2: Dentist and Schedule Selection
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
            Bước 2/3: Chọn bác sĩ và thời gian phù hợp
          </p>
        </div>

        {/* Dentist Selection */}
        <DentistSelector
          dentists={dentists}
          selectedDentist={selectedDentist}
          onSelect={selectDentist}
        />

        {/* Schedule Calendar */}
        {selectedDentist && (
          <ScheduleCalendar
            dentist={selectedDentist}
            currentWeek={currentWeek}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
            onDateSelect={handleDateSelect}
            onPreviousWeek={goToPreviousWeek}
            onNextWeek={goToNextWeek}
          />
        )}

        {/* Selected Info */}
        {selectedDentist && selectedDate && selectedTimeSlot && (
          <SelectedAppointmentInfo
            selectedDentist={selectedDentist}
            selectedDate={selectedDate}
            selectedTimeSlot={selectedTimeSlot}
          />
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

          {selectedDentist && selectedDate && selectedTimeSlot && (
            <button
              onClick={handleScheduleConfirm}
              disabled={bookAppointmentMutation.isPending}
              className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Tiếp Theo - Xác Minh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};