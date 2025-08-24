import { Layout } from '../../layouts/homepage/Layout';
import { Sparkles, Star, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import img3 from '@/assets/img3.jpg';
import img4 from '@/assets/img4.jpg';
import img5 from '@/assets/img5.jpg';
import img6 from '@/assets/img6.jpg';
import bg1 from '@/assets/bg1.png';
const services = [
  {
    name: "Làm Trắng Răng",
    description: "Làm trắng chuyên nghiệp cho nụ cười rạng rỡ và tự tin hơn",
    duration: "60-90 phút",
    results: "Răng trắng sáng lên đến 8 sắc thái"
  },
  {
    name: "Lớp Phủ Sứ",
    description: "Tạo nụ cười hoàn hảo với lớp phủ sứ tự nhiên và bền đẹp",
    duration: "2-3 tuần (bao gồm lấy dấu và lắp đặt)",
    results: "Nụ cười tự nhiên, không tì vết"
  },
  {
    name: "Chỉnh Nha Thẩm Mỹ",
    description: "Sử dụng mắc cài hoặc khay trong suốt để căn chỉnh răng",
    duration: "6-18 tháng",
    results: "Răng đều, khớp cắn hoàn hảo"
  },
  {
    name: "Nụ Cười Toàn Diện",
    description: "Kết hợp nhiều phương pháp để tạo nụ cười hoàn hảo",
    duration: "Nhhiều buổi hẹn",
    results: "Nụ cười đẹp tự nhiên, hài hòa với khuôn mặt"
  }
];

const beforeAfterCases = [
  {
    title: "Biến Đổi Sau Khi Làm Trắng Răng",
    description: "Tẩy trắng chuyên nghiệp giúp loại bỏ các vết ố qua nhiều năm",
    image: img6
  },
  {
    title: "Thay Đổi Nụ Cười Với Phủ Sứ",
    description: "Lớp phủ sứ tạo nên nụ cười hoàn hảo, tự nhiên và bền đẹp",
    image: img5
  },
  {
    title: "Chỉnh Nha Thẩm Mỹ Thành Công",
    description: "Chỉnh nha giúp răng đều và khớp cắn hoàn hảo, mang lại nụ cười tự tin",
    image: bg1
  }
];

const benefits = [
  "Tăng sự tự tin",
  "Tạo ấn tượng ban đầu tốt hơn",
  "Ngoại hình trẻ trung hơn",
  "Lợi thế trong công việc",
  "Cải thiện giao tiếp xã hội",
  "Hiệu quả lâu dài"
];

export const CosmeticDentistryPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Nha Khoa Thẩm Mỹ
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Biến hóa nụ cười của bạn với các phương pháp nha khoa thẩm mỹ tiên tiến. 
                Từ tẩy trắng đến cải thiện toàn diện, chúng tôi giúp bạn tự tin với nụ cười đẹp như mơ.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/appointment-booking")} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center justify-center">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Bắt đầu hành trình thay đổi
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                  Gọi +84 (03) 33-538-991
                </button>
              </div>
            </div>
            <div>
              <img
                src={img3}
                alt="Beautiful smile after cosmetic dentistry"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch Vụ Nha Khoa Thẩm Mỹ
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
               Lựa chọn các phương pháp phù hợp để cải thiện nụ cười của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {service.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {service.description}
                </p>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-gray-600">{service.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-gray-600">{service.results}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trường Hợp Thực Tế
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Xem những thay đổi ngoạn mục mà nha khoa thẩm mỹ có thể mang lại cho nụ cười của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {beforeAfterCases.map((case_, index) => (
              <div key={index} className="bg-white rounded-xl overflow-hidden shadow-lg">
                <img
                  src={case_.image}
                  alt={case_.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {case_.title}
                  </h3>
                  <p className="text-gray-600">
                    {case_.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Lợi Ích Khi Làm Nha Khoa Thẩm Mỹ
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Nha khoa thẩm mỹ không chỉ mang lại nụ cười đẹp mà còn cải thiện sức khỏe răng miệng và tâm lý của bạn.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src={img4}
                alt="Confident smile"
                className="rounded-2xl shadow-lg w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn Sàng Biến Đổi Nụ Cười Của Bạn?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-3xl mx-auto">
            Đặt lịch hẹn với chúng tôi ngay hôm nay để khám phá các dịch vụ nha khoa thẩm mỹ 
            và bắt đầu hành trình đến một nụ cười đẹp hơn.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-purple-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Lịch Hẹn Ngay
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
              Gọi +84 (03) 33-538-991
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};