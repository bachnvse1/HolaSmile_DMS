import { ArrowRight, Star, Users, Award } from 'lucide-react';
import bg1 from '@/assets/bg1.png'
import { useNavigate } from 'react-router';
export const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="home" className="relative bg-gradient-to-br from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Nơi Gìn Giữ
                <span className="text-blue-600"> Nụ Cười </span>
                <br />
                Việt
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Trải nghiệm dịch vụ chăm sóc nha khoa hiện đại với đội ngũ chuyên gia tận tâm. 
                Chúng tôi cam kết mang lại nụ cười khỏe mạnh và tự tin cho bạn.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => navigate("/appointment-booking")} className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                Đặt Lịch Hẹn
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button onClick={() => navigate("/#about")} className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                Tìm Hiểu Thêm
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Người bệnh hài lòng</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">4.9</div>
                <div className="text-sm text-gray-600">Đánh giá</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">5+</div>
                <div className="text-sm text-gray-600">Năm kinh nghiệm</div>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative">
            <div className="relative">
              <img
                src={bg1}
                alt="Modern dental clinic"
                className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              />
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Chăm Sóc Tuyệt Vời</div>
                    <div className="text-sm text-gray-600">Ngàn người tin tưởng</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};