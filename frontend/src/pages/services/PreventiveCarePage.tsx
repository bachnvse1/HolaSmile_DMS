import { Layout } from '../../components/layout/Layout';
import { Shield, Heart, Eye, Clock, CheckCircle, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import img2 from '@/assets/img2.jpg'
const preventiveServices = [
  {
    icon: Shield,
    title: "Trám Bít Hố Rãnh",
    description: "Lớp phủ bảo vệ răng hàm giúp ngăn sâu răng ở các rãnh sâu",
    duration: "30 phút",
    frequency: "Khi cần thiết"
  },
  {
    icon: Heart,
    title: "Điều Trị Fluor",
    description: "Thoa fluor chuyên nghiệp giúp răng chắc khỏe và ngừa sâu răng",
    duration: "15 phút",
    frequency: "Mỗi 6 tháng"
  },
  {
    icon: Eye,
    title: "Tầm Soát Ung Thư Miệng",
    description: "Khám toàn diện nhằm phát hiện sớm dấu hiệu ung thư miệng",
    duration: "10 phút",
    frequency: "Mỗi lần khám"
  },
  {
    icon: Clock,
    title: "Máng Chống Nghiến Răng & Thể Thao",
    description: "Thiết kế cá nhân hóa để bảo vệ khi chơi thể thao và ngừa mòn răng",
    duration: "2 lần hẹn",
    frequency: "Khi cần thiết"
  }
];

const ageSpecificCare = [
  {
    age: "Trẻ em (2-12)",
    focus: "Xây dựng thói quen tốt",
    services: ["Điều trị fluor", "Trám bít hố rãnh", "Hướng dẫn chăm sóc", "Làm sạch vui nhộn"],
    tips: "Dùng bàn chải màu sắc và kem đánh răng có vị dễ chịu để bé thích thú"
  },
  {
    age: "Thiếu niên (13-18)",
    focus: "Duy trì tính tự lập",
    services: ["Theo dõi chỉnh nha", "Đánh giá răng khôn", "Máng bảo vệ thể thao", "Ngừa sâu răng"],
    tips: "Hạn chế nước ngọt và đồ ăn vặt trong giờ học"
  },
  {
    age: "Người lớn (19-64)",
    focus: "Phòng ngừa viêm nướu",
    services: ["Cạo vôi sâu", "Tầm soát bệnh nướu", "Kiểm tra ung thư miệng", "Máng chống nghiến"],
    tips: "Xỉa răng hàng ngày và đi khám định kỳ"
  },
  {
    age: "Người cao tuổi (65+)",
    focus: "Duy trì sức khỏe răng miệng",
    services: ["Điều trị khô miệng", "Xem xét thuốc đang dùng", "Chăm sóc răng giả", "Ngăn sâu chân răng"],
    tips: "Uống đủ nước và báo với bác sĩ mọi loại thuốc đang dùng"
  }
];

const homeCareTips = [
  {
    category: "Đánh Răng Hàng Ngày",
    tips: [
      "Đánh răng 2 lần/ngày với kem chứa fluor",
      "Dùng bàn chải lông mềm",
      "Đánh ít nhất 2 phút",
      "Thay bàn chải mỗi 3–4 tháng"
    ]
  },
  {
    category: "Dùng Chỉ Nha Khoa",
    tips: [
      "Dùng chỉ nha khoa mỗi ngày",
      "Kỹ thuật đúng – di chuyển nhẹ nhàng lên xuống",
      "Cân nhắc máy tăm nước cho vùng khó tiếp cận",
      "Không dùng lại đoạn chỉ đã sử dụng"
    ]
  },
  {
    category: "Chế Độ Ăn & Lối Sống",
    tips: [
      "Hạn chế thức ăn/uống có đường hoặc axit",
      "Uống nhiều nước suốt cả ngày",
      "Không dùng răng như công cụ",
      "Ngưng hút thuốc, hạn chế rượu"
    ]
  }
];

const benefits = [
  "Ngăn ngừa sâu răng và lỗ sâu",
  "Giảm nguy cơ viêm nướu",
  "Phát hiện sớm các vấn đề răng miệng",
  "Tiết kiệm chi phí điều trị sau này",
  "Duy trì hơi thở thơm mát",
  "Bảo vệ sức khỏe toàn thân"
];

export const PreventiveCare = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/*Introduction */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Chăm Sóc Phòng Ngừa
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Phòng bệnh hơn chữa bệnh. Chương trình chăm sóc phòng ngừa toàn diện giúp bạn tránh rắc rối nha khoa trước khi xảy ra, tiết kiệm thời gian, chi phí và khó chịu lâu dài.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/appointment-booking")} className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Bắt đầu kế hoạch phòng ngừa
                </button>
                <button className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                  Tìm hiểu thêm
                </button>
              </div>
            </div>
            <div>
              <img
                src={img2}
                alt="Chăm sóc răng phòng ngừa"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/*Prevention Service*/}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch Vụ Phòng Ngừa
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Các phương pháp điều trị phòng ngừa phù hợp với từng nhu cầu của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {preventiveServices.map((service, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg flex-shrink-0">
                    <service.icon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {service.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-gray-600">{service.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-gray-600">{service.frequency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*Take Care For Each Age*/}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Chăm Sóc Theo Từng Độ Tuổi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chiến lược phòng ngừa phù hợp với từng giai đoạn cuộc sống
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ageSpecificCare.map((group, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-center mb-4">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white text-sm font-bold py-2 px-4 rounded-lg">
                    {group.age}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 text-center">
                  {group.focus}
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dịch vụ chính:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {group.services.map((service, idx) => (
                        <li key={idx}>• {service}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Mẹo nhỏ:</h4>
                    <p className="text-sm text-gray-600">{group.tips}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Home Instructions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hướng Dẫn Chăm Sóc Tại Nhà
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thói quen thiết yếu hàng ngày để có sức khỏe răng miệng tối ưu
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {homeCareTips.map((category, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.tips.map((tip, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
                      <span className="text-gray-700 text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Vì Sao Nên Phòng Ngừa?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Đầu tư phòng ngừa hôm nay sẽ giúp bạn tránh những rắc rối ngày mai.
                Đây là nền tảng cho sức khỏe răng miệng bền vững.
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
                src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Nụ cười khỏe mạnh"
                className="rounded-2xl shadow-lg w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Bắt Đầu Hành Trình Phòng Ngừa Ngay Hôm Nay
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Đừng đợi đến khi có vấn đề mới xử lý. Chủ động bảo vệ sức khỏe răng miệng cùng chúng tôi ngay hôm nay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt lịch khám phòng ngừa
            </button>
            <button onClick={() => navigate("/#services")}className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Xem các gói dịch vụ khác
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};
