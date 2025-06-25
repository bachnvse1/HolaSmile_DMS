import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useState } from 'react';

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  return (
    <section id="contact" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Liên Hệ Với Chúng Tôi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sẵn sàng bắt đầu hành trình đến một nụ cười khỏe mạnh và đẹp hơn? 
            Hãy liên hệ với chúng tôi ngay hôm nay để đặt lịch hẹn.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Thông Tin</h3>
              <p className="text-gray-600 mb-8">
                Chúng tôi ở đây để giúp bạn với tất cả các nhu cầu nha khoa của bạn. 
                Liên hệ với chúng tôi bằng bất kỳ phương pháp nào dưới đây hoặc điền vào mẫu và chúng tôi sẽ liên hệ lại với bạn sớm nhất có thể.
              </p>
            </div>

            {/* Contact Details */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Địa Chỉ</h4>
                  <p className="text-gray-600">Khu CNC<br />Thạch Thất, Hà Nội</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Điện thoại</h4>
                  <p className="text-gray-600">+84 (09) 41-120-015</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                  <p className="text-gray-600">info@holasmile.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Giờ Làm Việc</h4>
                  <div className="text-gray-600 space-y-1">
                    <p>Thứ hai - Thứ sáu: 8:00 AM - 6:00 PM</p>
                    <p>Thứ bảy: 9:00 AM - 4:00 PM</p>
                    <p>Chủ nhật: Đóng cửa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h4 className="font-semibold text-red-900 mb-2">Số Điện Thoại Khẩn Cấp</h4>
              <p className="text-red-700 text-sm">
                Trong trường hợp khẩn cấp nha khoa ngoài giờ làm việc, vui lòng gọi:
                <span className="font-semibold"> +84 (09) 41-120-015</span>
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn cho chúng tôi</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Địa chỉ Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    Dịch Vụ
                  </label>
                  <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Chọn một dịch vụ</option>
                    <option value="general">Nha Khoa Tổng Quát</option>
                    <option value="cosmetic">Nha Khoa Thẩm Mỹ</option>
                    <option value="orthodontics">Nha Khoa Trẻ Em</option>
                    <option value="oral-surgery"> Phẫu Thuật Răng Miệng</option>
                    <option value="pediatric">Chăm Sóc Dự Phòng</option>
                    <option value="emergency">Nha Khoa Phục Hồi</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Lời Nhắn
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your dental needs or questions..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Gửi Tin Nhắn
                <Send className="ml-2 h-5 w-5" />
              </button>
            </form>
          </div>
        </div>        
        {/* Map Section */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-96">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.5063419425055!2d105.52271427509262!3d21.01241668063283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135abc60e7d3f19%3A0x2be9d7d0b5abcbf4!2sFPT%20University!5e0!3m2!1sen!2s!4v1749738836602!5m2!1sen!2s"
                width="100%"
                height="100%"
                className="border-0"
                allowFullScreen={true}
                referrerPolicy="no-referrer-when-downgrade"
                title="Dental Clinic Location"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};