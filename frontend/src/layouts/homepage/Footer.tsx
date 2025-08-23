import { MapPin, Phone, Mail, Clock, Facebook, Twitter, Instagram } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">HolaSmile</h3>
            <p className="text-gray-300 mb-4">
              Cung cấp dịch vụ chăm sóc răng miệng đặc biệt với công nghệ tiên tiến và dịch vụ tận tâm. Nụ cười của bạn là ưu tiên hàng đầu của chúng tôi.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-blue-400">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-blue-400">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-blue-400">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Thông Tin Liên Hệ</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-blue-400" />
                <span className="text-gray-300">Địa chỉ: Khu CNC, Thạch Thất, Hà Nội</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-blue-400" />
                <span className="text-gray-300">Số điện thoại: +84 (03) 33-538-991</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-blue-400" />
                <span className="text-gray-300">Email hỗ trợ: info@holasmile.com</span>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Giờ Làm Việc</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-blue-400" />
                <div className="text-gray-300">
                  <p>Sáng: 8:00 - 11:00 </p>
                  <p>Chiều: 14:00 - 17:00 </p>
                  <p>Tối: 17:00 - 20:00 </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 HolaSmile. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};