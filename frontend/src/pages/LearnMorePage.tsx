import { Layout } from '../components/layout/Layout';
import { CheckCircle, Award, Users, Clock, Shield, Heart, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
import bg2 from '@/assets/bg2.jpg';
import bg3 from '@/assets/bg3.jpg';
import bg4 from '@/assets/bg4.jpg';
const achievements = [
  {
    icon: Award,
    title: "5+ Năm Kinh Nghiệm",
    description: "Hơn 500 bệnh nhân đã được chúng tôi chăm sóc tận tình"
  },
  {
    icon: Users,
    title: "500+ Bệnh Nhân",
    description: "Đội ngũ chuyên gia nha khoa giàu kinh nghiệm và tận tâm"
  },
  {
    icon: Star,
    title: "4.9/5 Đánh Giá",
    description: "Đánh giá xuất sắc từ bệnh nhân về chất lượng dịch vụ"
  },
  {
    icon: Shield,
    title: "Công Nghệ Hiện Đại",
    description: "Trang thiết bị tiên tiến nhất cho điều trị chính xác và thoải mái"
  }
];

const philosophy = [
  {
    icon: Heart,
    title: "Đặt Bệnh Nhân Là Trung Tâm",
    description: "Chúng tôi lắng nghe và hiểu nhu cầu của bạn, tạo ra kế hoạch điều trị cá nhân hóa phù hợp với mục tiêu sức khỏe răng miệng của bạn."
  },
  {
    icon: Shield,
    title: "Chăm Sóc Toàn Diện",
    description: "Chúng tôi cung cấp dịch vụ nha khoa toàn diện, từ kiểm tra định kỳ đến điều trị chuyên sâu, đảm bảo mọi nhu cầu của bạn đều được đáp ứng."
  },
  {
    icon: Clock,
    title: "Thoải Mái và Không Đau Đớn",
    description: "Chúng tôi sử dụng các kỹ thuật tiên tiến và công nghệ hiện đại để đảm bảo quá trình điều trị thoải mái nhất có thể, giảm thiểu đau đớn và lo lắng."
  },
  {
    icon: CheckCircle,
    title: "Chất Lượng và An Toàn",
    description: "Chúng tôi cam kết cung cấp dịch vụ nha khoa an toàn và chất lượng cao nhất, tuân thủ các tiêu chuẩn nghiêm ngặt về vệ sinh và an toàn."
  }
];

const certifications = [
  "Chứng chỉ hành nghề khám, chữa bệnh chuyên khoa Răng Hàm Mặt",
  "Thành viên Hội Răng Hàm Mặt Việt Nam (VOSA)",
  "Chứng chỉ Implant Nha khoa",
  "Thành viên Liên đoàn Nha khoa Thẩm mỹ AAFD",
  "Chứng chỉ Chẩn đoán & Điều trị chỉnh nha (Niềng răng)",
  "Đạt tiêu chuẩn phòng khám đạt chuẩn Bộ Y tế"
];

const technologies = [
  {
    name: "X-Quang Kỹ Thuật Số",
    description: "Chẩn đoán chính xác với lượng bức xạ thấp hơn so với X-quang truyền thống"
  },
  {
    name: "Máy Quét Khoang Miệng",
    description: "Hình ảnh rõ nét về tình trạng răng miệng giúp bạn hiểu rõ hơn về quá trình điều trị"
  },
  {
    name: "Laser Nha Khoa",
    description: "Điều trị sâu răng và nướu hiệu quả mà không cần phẫu thuật xâm lấn"
  },
  {
    name: "Hình Ảnh 3D",
    description: "Mô phỏng chính xác cấu trúc răng miệng để lập kế hoạch điều trị tốt nhất"
  },
  {
    name: "Công Nghệ CAD/CAM",
    description: "Chế tạo mão răng và phục hình nhanh chóng và chính xác ngay tại phòng khám"
  },
  {
    name: "Tùy Chọn An Thần",
    description: "Giúp bệnh nhân thư giãn và thoải mái trong suốt quá trình điều trị, giảm lo lắng và đau đớn"
  }
];

export const LearnMorePage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Tìm Hiểu Thêm Về HolaSmile
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Khám phá câu chuyện của chúng tôi, triết lý chăm sóc và cam kết 
              mang lại dịch vụ nha khoa chất lượng cao nhất cho cộng đồng.
            </p>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center bg-white rounded-xl p-6 shadow-lg">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <achievement.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {achievement.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Câu Chuyện Của Chúng Tôi
              </h2>
              <div className="space-y-6 text-gray-600">
                <p>
                  HolaSmile được thành lập vào năm 2020 với sứ mệnh đơn giản nhưng mạnh mẽ: 
                  cung cấp dịch vụ nha khoa chất lượng cao trong một môi trường thoải mái và thân thiện.
                </p>
                <p>
                  Bắt đầu như một phòng khám nhỏ, chúng tôi đã phát triển thành một trung tâm 
                  nha khoa hiện đại với đội ngũ chuyên gia giàu kinh nghiệm và công nghệ tiên tiến nhất.
                </p>
                <p>
                  Triết lý của chúng tôi luôn đặt bệnh nhân làm trung tâm. Chúng tôi tin rằng 
                  mỗi nụ cười đều độc đáo và xứng đáng được chăm sóc tốt nhất.
                </p>
                <p>
                  Qua hơn 5 năm hoạt động, chúng tôi đã có vinh dự chăm sóc hơn 5,00 bệnh nhân 
                  và tạo ra hàng nghìn nụ cười tự tin, khỏe mạnh.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <img
                src={bg2}
                alt="Dental clinic interior"
                className="rounded-lg shadow-lg w-full h-64 object-cover"
              />
              <div className="grid grid-cols-2 gap-4">
                <img
                  src={bg3}
                  alt="Happy patient"
                  className="rounded-lg shadow-lg h-32 object-cover"
                />
                <img
                  src={bg4}
                  alt="Modern equipment"
                  className="rounded-lg shadow-lg h-32 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Triết Lý Chăm Sóc
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Các nguyên tắc cốt lõi định hướng cách chúng tôi chăm sóc bệnh nhân
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {philosophy.map((item, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Công Nghệ Tiên Tiến
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi đầu tư vào các công nghệ nha khoa mới nhất để đảm bảo 
              điều trị chính xác, thoải mái và hiệu quả
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {technologies.map((tech, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {tech.name}
                </h3>
                <p className="text-gray-600">
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Chứng Chỉ & Thành Viên
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cam kết của chúng tôi với chất lượng được thể hiện qua các chứng chỉ 
              và thành viên của các tổ chức nha khoa uy tín
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                  <span className="text-gray-900 font-medium">{cert}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn Sàng Bắt Đầu Hành Trình Chăm Sóc Nha Khoa?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Hãy để chúng tôi giúp bạn đạt được nụ cười khỏe mạnh và tự tin mà bạn xứng đáng có được.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Lịch Hẹn
            </button>
            <button onClick={() => navigate("/#services")}className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Xem các gói dịch vụ
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};