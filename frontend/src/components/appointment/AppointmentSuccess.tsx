import React, { useEffect } from 'react';
import { CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import type { Dentist, TimeSlot, AppointmentFormData } from '../../types/appointment';

interface AppointmentSuccessProps {
  successMessage: string;
  selectedDentist: Dentist | null;
  selectedDate: string;
  selectedTimeSlot: string;
  step1Data: AppointmentFormData | null;
  timeSlotsWithIcons: TimeSlot[];
  onReset: () => void;
  error?: string | null;
}

export const AppointmentSuccess: React.FC<AppointmentSuccessProps> = ({
  successMessage,
  selectedDentist,
  selectedDate,
  selectedTimeSlot,
  step1Data,
  timeSlotsWithIcons,
  onReset,
  error = null,
}) => {
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (error) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="bg-gradient-to-br from-red-100 to-pink-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Đặt Lịch Không Thành Công
          </h3>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>

          <button
            onClick={onReset}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
          >
            Thử Lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
        <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-3xl font-bold text-gray-900 mb-4">
          Đặt Lịch Thành Công!
        </h3>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6 text-left">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Thông tin lịch hẹn:
          </h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium text-gray-700">Nha sĩ:</span> {selectedDentist?.name}</p>
            <p><span className="font-medium text-gray-700">Ngày:</span> {new Date(selectedDate).toLocaleDateString('vi-VN')}</p>
            <p><span className="font-medium text-gray-700">Ca làm việc:</span> {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.label}</p>
            <p><span className="font-medium text-gray-700">Thời gian:</span> {timeSlotsWithIcons.find(slot => slot.period === selectedTimeSlot)?.timeRange}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Lưu ý:</strong> Nếu số điện thoại <strong>{step1Data?.phoneNumber}</strong> chưa có trong hệ thống,
            chúng tôi đã tự động tạo hồ sơ bệnh nhân cho bạn.
            Chúng tôi sẽ liên hệ xác nhận lịch hẹn trong vòng 24 giờ.
          </p>
        </div>

        <button
          onClick={onReset}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105"
        >
          Đặt Lịch Khác
        </button>
      </div>
    </div>
  );
};