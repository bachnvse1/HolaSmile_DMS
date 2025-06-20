import { Layout } from '@/layouts/homepage/Layout';
import { BookAppointmentForm } from '@/components/appointment/BookAppointmentForm';
import { Clock, MapPin, Phone } from 'lucide-react';

export const BookAppointmentPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Đặt Lịch Hẹn Khám
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chọn thời gian phù hợp và để lại thông tin, chúng tôi sẽ liên hệ xác nhận lịch hẹn trong thời gian sớm nhất
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <BookAppointmentForm />
            </div>

            {/* Sidebar Info */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Thông Tin Liên Hệ
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Địa chỉ:</p>
                      <p className="text-gray-600">Khu CNC, Thạch Thất, Hà Nội</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Hotline:</p>
                      <p className="text-gray-600">+84 (09) 41-120-015</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900">Giờ làm việc:</p>
                      <p className="text-gray-600">T2-T6: 8:00 AM - 8:00 PM</p>
                      <p className="text-gray-600">T7: 8:00 AM - 11:00 AM</p>
                      <p className="text-gray-600">CN: Nghỉ</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Emergency Contact */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Cấp Cứu Nha Khoa
                </h3>
                <p className="text-red-700 mb-4">
                  Đau răng cấp tính, chấn thương răng miệng
                </p>
                <button className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  Gọi Ngay: 0941120015
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};