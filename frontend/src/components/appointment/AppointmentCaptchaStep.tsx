import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Shield } from 'lucide-react';
import { CanvasCaptcha } from '../ui/CanvasCaptcha';
import type { AppointmentFormData } from '../../lib/validations/appointment';
import type { Dentist } from '../../types/appointment';

interface AppointmentCaptchaStepProps {
  step1Data: AppointmentFormData;
  selectedDentist: Dentist;
  selectedDate: string;
  selectedTimeSlot: string;
  onBack: () => void;
  onSubmit: (captchaInput: string, captchaValue: string) => void;
  isLoading: boolean;
  error?: string;
}

export const AppointmentCaptchaStep: React.FC<AppointmentCaptchaStepProps> = ({
  step1Data,
  selectedDentist,
  selectedDate,
  selectedTimeSlot,
  onBack,
  onSubmit,
  isLoading,
  error
}) => {
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const timeSlotsMap = {
    'morning': { label: 'Ca Sáng', timeRange: '8:00 - 11:00' },
    'afternoon': { label: 'Ca Chiều', timeRange: '14:00 - 17:00' },
    'evening': { label: 'Ca Tối', timeRange: '17:00 - 20:00' }
  };

  const handleSubmit = () => {
    setCaptchaError('');
    
    if (!captchaInput.trim()) {
      setCaptchaError('Vui lòng nhập mã xác minh');
      return;
    }
    
    if (captchaInput.trim().length !== 6) {
      setCaptchaError('Mã xác minh phải có đúng 6 ký tự');
      return;
    }
    
    if (captchaInput.trim().toUpperCase() !== captchaValue.toUpperCase()) {
      setCaptchaError('Mã xác minh không đúng, vui lòng thử lại');
      return;
    }
    
    onSubmit(captchaInput, captchaValue);
  };

  const selectedSlot = timeSlotsMap[selectedTimeSlot as keyof typeof timeSlotsMap];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Xác Minh Bảo Mật
          </h2>
          <p className="text-gray-600">
            Bước 3/3: Xác minh để hoàn tất đặt lịch
          </p>
        </div>

        {/* Appointment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-4">
            Thông tin đặt lịch của bạn:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Họ tên:</span>
              <p className="font-semibold text-gray-900 truncate" title={step1Data.fullName}>
                {step1Data.fullName.length > 20 ? `${step1Data.fullName.substring(0, 20)}...` : step1Data.fullName}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="font-semibold text-gray-900 truncate" title={step1Data.email}>
                {step1Data.email.length > 20 ? `${step1Data.email.substring(0, 20)}...` : step1Data.email}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Số điện thoại:</span>
              <p className="font-semibold text-gray-900" title={step1Data.phoneNumber}>{step1Data.phoneNumber}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Nha sĩ:</span>
              <p className="font-semibold text-gray-900 truncate" title={selectedDentist.name}>
                {selectedDentist.name.length > 20 ? `${selectedDentist.name.substring(0, 20)}...` : selectedDentist.name}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Ngày khám:</span>
              <p className="font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <span className="text-sm font-medium text-gray-600">Ca làm việc:</span>
              <p className="font-semibold text-gray-900">
                {selectedSlot ? `${selectedSlot.label} (${selectedSlot.timeRange})` : selectedTimeSlot}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 mt-4">
            <span className="text-sm font-medium text-gray-600">Vấn đề gặp phải:</span>
            <p className="font-semibold text-gray-900 mt-1" title={step1Data.medicalIssue}>
              {step1Data.medicalIssue.length > 100 
                ? `${step1Data.medicalIssue.substring(0, 100)}...` 
                : step1Data.medicalIssue
              }
            </p>
          </div>
        </div>

        {/* Captcha Input */}
        <CanvasCaptcha
          value={captchaInput}
          onChange={setCaptchaInput}
          onCaptchaValueChange={setCaptchaValue}
          error={captchaError}
          className="mb-6"
        />

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center px-8 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay Lại
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !captchaInput.trim() || captchaInput.trim().length !== 6}
            className="flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            {isLoading ? 'Đang xử lý...' : 'Hoàn Tất Đặt Lịch'}
          </button>
        </div>
      </div>
    </div>
  );
};