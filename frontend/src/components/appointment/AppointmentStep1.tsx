import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { User, Mail, Phone, FileText, ArrowRight } from 'lucide-react';
import type { AppointmentFormData } from '../../types/appointment';
import axiosInstance from '@/lib/axios';

interface AppointmentStep1Props {
  form: UseFormReturn<AppointmentFormData>;
  onSubmit: (data: AppointmentFormData) => void;
}

export const AppointmentStep1: React.FC<AppointmentStep1Props> = ({ form, onSubmit }) => {
  const { register, handleSubmit, formState: { errors }, watch } = form;
  const [serverErrors, setServerErrors] = React.useState<Record<string, string>>({});
  const handleValidateAndSubmit = async (data: AppointmentFormData) => {
    setServerErrors({});
    try {
      // Gọi API validate
      await axiosInstance.post('/Guest/ValidateBookAppointment', data);
      // Nếu không lỗi, gọi onSubmit tiếp tục
      onSubmit(data);
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setServerErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        const msg = err.response.data.message;
        if (msg.includes('điện thoại')) {
          setServerErrors({ phoneNumber: msg });
        } else if (msg.toLowerCase().includes('email')) {
          setServerErrors({ email: msg });
        } else if (msg.toLowerCase().includes('họ tên')) {
          setServerErrors({ fullName: msg });
        } else {
          // fallback: gán vào một trường chung hoặc hiển thị toast
          setServerErrors({ general: msg });
        }
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Thông Tin Cá Nhân
          </h2>
          <p className="text-gray-600">
            Bước 1/2: Vui lòng điền thông tin của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit(handleValidateAndSubmit)} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <User className="inline h-4 w-4 mr-2" />
              Họ và Tên *
            </label>
            <input
              {...register('fullName')}
              type="text"
              placeholder="Nhập họ và tên đầy đủ"
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
            />
            {(errors.fullName || serverErrors.fullName) && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {errors.fullName?.message || serverErrors.fullName}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Mail className="inline h-4 w-4 mr-2" />
              Email *
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="example@email.com"
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
            />
            {(errors.email || serverErrors.email) && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {errors.email?.message || serverErrors.email}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Phone className="inline h-4 w-4 mr-2" />
              Số Điện Thoại *
            </label>
            <input
              {...register('phoneNumber')}
              type="tel"
              placeholder="0912345678"
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
            />
            {(errors.phoneNumber || serverErrors.phoneNumber) && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {serverErrors.phoneNumber === "Số điện thoại đã được đăng ký tài khoản" ? (
                  <>
                    {serverErrors.phoneNumber} –{' '}
                    <a
                      href="/login"
                      className="underline text-blue-600 hover:text-blue-800 ml-1"
                    >
                      Đăng nhập
                    </a>
                    &nbsp;để đặt lịch hẹn&nbsp;
                  </>
                ) : (
                  errors.phoneNumber?.message || serverErrors.phoneNumber
                )}
              </p>
            )}
          </div>

          {/* Medical Issue */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <FileText className="inline h-4 w-4 mr-2" />
              Vấn Đề Bạn Gặp Phải *
            </label>
            <textarea
              {...register('medicalIssue')}
              rows={4}
              placeholder="Mô tả chi tiết vấn đề nha khoa bạn đang gặp phải..."
              className={`w-full px-4 py-4 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${errors.medicalIssue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
            />
            {(errors.medicalIssue || serverErrors.medicalIssue) && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <span className="w-1 h-1 bg-red-600 rounded-full mr-2"></span>
                {errors.medicalIssue?.message || serverErrors.medicalIssue}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {watch('medicalIssue')?.length || 0}/500 ký tự
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105 flex items-center justify-center"
          >
            Tiếp Theo
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </form>
      </div>
    </div>
  );
};