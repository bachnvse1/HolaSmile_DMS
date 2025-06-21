import { Layout } from '../../layouts/homepage/Layout';
import { Heart, Shield, Smile, Star, Calendar, Gift, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router';
const services = [
  {
    icon: Shield,
    title: "Chăm sóc phòng ngừa",
    description: "Vệ sinh định kỳ, bôi fluor và trám bít hố rãnh để ngăn ngừa sâu răng",
    ageGroup: "Mọi độ tuổi"
  },
  {
    icon: Smile,
    title: "Khám răng nhẹ nhàng",
    description: "Khám thân thiện cho trẻ để theo dõi sự phát triển và mọc răng",
    ageGroup: "Từ 6 tháng tuổi"
  },
  {
    icon: Heart,
    title: "Điều trị phục hồi",
    description: "Trám răng và mão răng màu răng phù hợp với trẻ em",
    ageGroup: "Khi cần thiết"
  },
  {
    icon: Star,
    title: "Đánh giá chỉnh nha",
    description: "Đánh giá sớm khả năng cần niềng răng trong tương lai",
    ageGroup: "Từ 7 tuổi trở lên"
  }
];

const tips = [
  {
    title: "Bắt đầu sớm",
    description: "Lần khám răng đầu tiên nên vào lúc 1 tuổi hoặc trong vòng 6 tháng kể từ khi mọc răng đầu tiên"
  },
  {
    title: "Biến thành trò chơi",
    description: "Sử dụng ngôn từ tích cực và biến việc đánh răng thành trò chơi"
  },
  {
    title: "Làm gương cho trẻ",
    description: "Trẻ học nhanh nhất bằng cách quan sát cha mẹ chăm sóc răng miệng"
  },
  {
    title: "Chế độ ăn lành mạnh",
    description: "Hạn chế đồ ngọt, khuyến khích uống nước và ăn thực phẩm bổ dưỡng"
  },
  {
    title: "Khám định kỳ",
    description: "Đặt lịch vệ sinh răng mỗi 6 tháng để duy trì sức khỏe răng miệng"
  },
  {
    title: "Bảo vệ bằng fluor",
    description: "Sử dụng kem đánh răng có fluor và cân nhắc điều trị fluor tại nha khoa"
  }
];

const ageGuidelines = [
  {
    age: "0-2 tuổi",
    milestones: ["Mọc răng đầu tiên", "Lần khám nha đầu tiên", "Bắt đầu làm sạch bằng nước"],
    care: "Làm sạch nhẹ nhàng bằng khăn mềm hoặc bàn chải dành cho trẻ sơ sinh"
  },
  {
    age: "2-4 tuổi",
    milestones: ["Mọc đủ răng sữa", "Bắt đầu dùng kem đánh răng chứa fluor", "Tập nhổ kem sau khi đánh"],
    care: "Cha mẹ giám sát đánh răng 2 lần/ngày, bắt đầu xỉa răng khi răng chạm nhau"
  },
  {
    age: "5-8 tuổi",
    milestones: ["Rụng răng sữa đầu tiên", "Mọc răng vĩnh viễn", "Trẻ bắt đầu đánh răng độc lập"],
    care: "Tiếp tục giám sát, có thể trám bít hố rãnh cho răng hàm vĩnh viễn"
  },
  {
    age: "9 tuổi trở lên",
    milestones: ["Hầu hết răng vĩnh viễn đã mọc", "Đánh giá chỉnh nha", "Chăm sóc như người lớn"],
    care: "Tự chăm sóc răng miệng, cha mẹ kiểm tra định kỳ"
  }
];

export const PediatricDentistryPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Phần giới thiệu */}
      <section className="bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Nha Khoa Trẻ Em
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Tạo trải nghiệm nha khoa tích cực cho trẻ trong môi trường thân thiện, vui vẻ. 
                Chúng tôi chuyên chăm sóc nha khoa thoải mái và thú vị cho trẻ ở mọi lứa tuổi.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/appointment-booking")} className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-colors flex items-center justify-center">
                  <Gift className="mr-2 h-5 w-5" />
                  Đặt lịch khám vui vẻ
                </button>
                <button className="border-2 border-green-500 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                  Gọi +84 (09) 41-120-015
                </button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Trẻ em vui vẻ đi khám nha"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dịch vụ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch Vụ Dành Riêng Cho Trẻ
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chăm sóc nha khoa toàn diện, phù hợp với từng giai đoạn phát triển của trẻ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                    <service.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-3">
                      {service.description}
                    </p>
                    <span className="inline-block bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
                      {service.ageGroup}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hướng dẫn theo độ tuổi */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hướng Dẫn Chăm Sóc Theo Độ Tuổi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hiểu rõ những gì cần chú ý trong từng giai đoạn phát triển răng miệng của trẻ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ageGuidelines.map((guide, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="bg-gradient-to-r from-green-400 to-blue-400 text-white text-lg font-bold py-2 px-4 rounded-lg">
                    {guide.age}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cột mốc:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {guide.milestones.map((milestone, idx) => (
                        <li key={idx}>• {milestone}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Chăm sóc chính:</h4>
                    <p className="text-sm text-gray-600">{guide.care}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mẹo cho phụ huynh */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Mẹo Dành Cho Phụ Huynh
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chiến lược đơn giản giúp trẻ hình thành thói quen chăm sóc răng miệng tốt
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tips.map((tip, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {tip.title}
                </h3>
                <p className="text-gray-600">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Điều đặc biệt của chúng tôi */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Điều Làm Chúng Tôi Khác Biệt
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Phần thưởng thú vị</h3>
              <p className="text-gray-600">
                Hộp quà, nhãn dán, chứng nhận làm cho mỗi lần đến nha sĩ đều đáng nhớ.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Nhân viên thân thiện với trẻ</h3>
              <p className="text-gray-600">
                Đội ngũ của chúng tôi được đào tạo đặc biệt để làm việc với trẻ nhỏ.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Thời gian linh hoạt</h3>
              <p className="text-gray-600">
                Có các khung giờ sau giờ học và cuối tuần để phù hợp lịch trình gia đình bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Kêu gọi hành động */}
      <section className="py-20 bg-gradient-to-r from-green-500 to-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Dành Tặng Bé Nụ Cười Khỏe Mạnh
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Hãy bắt đầu hành trình chăm sóc răng miệng lâu dài với trải nghiệm vui vẻ mà bé sẽ mong đợi mỗi lần đến nha sĩ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt lịch khám đầu tiên
            </button>
            <button onClick={() => navigate("/#services")} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors">
              Xem thêm dịch vụ 
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};
