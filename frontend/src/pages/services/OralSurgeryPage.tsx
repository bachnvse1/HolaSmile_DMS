import { Layout } from '../../layouts/homepage/Layout';
import { Shield, Clock, Heart, CheckCircle, AlertTriangle, Calendar, Phone } from 'lucide-react';
import { useNavigate } from 'react-router';
const procedures = [
  {
    name: "Nhổ răng khôn",
    description: "Loại bỏ an toàn răng khôn gây phiền toái để tránh chen chúc và đau đớn",
    duration: "30-60 phút",
    recovery: "3-7 ngày"
  },
  {
    name: "Nhổ răng",
    description: "Nhổ nhẹ nhàng răng hư hỏng hoặc nhiễm trùng không thể bảo tồn",
    duration: "15-45 phút",
    recovery: "2-5 ngày"
  },
  {
    name: "Cấy ghép Implant",
    description: "Cấy ghép trụ titanium để thay thế răng đã mất",
    duration: "1-2 giờ",
    recovery: "1-2 tuần"
  },
  {
    name: "Ghép xương",
    description: "Tăng thể tích xương để chuẩn bị cho cấy ghép hoặc bảo tồn xương hàm",
    duration: "1-2 giờ",
    recovery: "2-4 tuần"
  }
];

const comfortMeasures = [
  {
    icon: Shield,
    title: "Tùy chọn gây tê tiên tiến",
    description: "Có sẵn khí gây cười, thuốc uống an thần, và truyền tĩnh mạch để tạo sự thoải mái tối đa"
  },
  {
    icon: Heart,
    title: "Kỹ thuật nhẹ nhàng",
    description: "Thực hiện thủ thuật ít xâm lấn với công nghệ hiện đại"
  },
  {
    icon: Clock,
    title: "Điều trị nhanh chóng",
    description: "Tối ưu hóa quy trình giúp giảm thời gian ngồi trên ghế nha"
  }
];

const recoveryTips = [
  "Chườm đá trong 24 giờ đầu để giảm sưng",
  "Dùng thuốc theo đơn để kiểm soát cơn đau",
  "Ăn thức ăn mềm và tránh thức uống nóng vài ngày đầu",
  "Không hút thuốc hoặc dùng ống hút để tránh viêm ổ răng khô",
  "Súc miệng nhẹ bằng nước muối ấm sau 24 giờ",
  "Nghỉ ngơi và tránh vận động mạnh trong 24-48 giờ",
  "Tuân thủ hướng dẫn chăm sóc hậu phẫu cẩn thận"
];

const warningSignsData = [
  "Chảy máu nhiều không cầm được dù đã ép",
  "Đau dữ dội tăng lên sau 2-3 ngày",
  "Dấu hiệu nhiễm trùng: sốt, vị lạ hoặc mùi hôi",
  "Tê kéo dài không dứt sau thời gian dự kiến",
  "Khó nuốt hoặc khó thở",
  "Dị ứng với thuốc được kê"
];

export const OralSurgeryPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-teal-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Phẫu Thuật Răng Miệng
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Thực hiện phẫu thuật răng miệng một cách chính xác và tận tâm. 
                Chúng tôi sử dụng công nghệ tiên tiến và nhiều lựa chọn gây tê 
                để mang lại trải nghiệm thoải mái nhất cho bạn.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/appointment-booking")} className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch tư vấn
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Đường dây khẩn cấp
                </button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Phòng phẫu thuật răng hiện đại"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Procedures section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Các Thủ Thuật Răng Miệng
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Giải pháp phẫu thuật toàn diện cho các vấn đề răng miệng phức tạp
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {procedures.map((procedure, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {procedure.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {procedure.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Thời gian: {procedure.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-gray-600">Phục hồi: {procedure.recovery}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comfortable measures section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ưu Tiên Sự Thoải Mái Của Bạn
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi cung cấp nhiều lựa chọn để đảm bảo bạn luôn cảm thấy thoải mái trong suốt quá trình
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {comfortMeasures.map((measure, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <measure.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {measure.title}
                </h3>
                <p className="text-gray-600">
                  {measure.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Caution section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Hướng Dẫn Hồi Phục Sau Phẫu Thuật
              </h2>
              <div className="space-y-4">
                {recoveryTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2">
                  Lưu ý: Mỗi người sẽ hồi phục khác nhau
                </h3>
                <p className="text-green-700 text-sm">
                  Hãy tuân theo hướng dẫn cụ thể và đừng ngần ngại liên hệ với chúng tôi nếu có thắc mắc.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Khi Nào Cần Liên Hệ Ngay
              </h2>
              <div className="space-y-4">
                {warningSignsData.map((sign, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{sign}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-red-50 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">
                  Hỗ Trợ Khẩn Cấp 24/7
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  Nếu gặp bất kỳ triệu chứng nào đáng lo ngại, hãy liên hệ với chúng tôi ngay lập tức.
                </p>
                <button className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
                  +84 (03) 33-538-991
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Công Nghệ Phẫu Thuật Tân Tiến
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Thiết bị hiện đại giúp phẫu thuật chính xác và ít xâm lấn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Hình ảnh & Lập kế hoạch 3D
              </h3>
              <p className="text-gray-600">
                Máy CBCT cung cấp hình ảnh 3D chi tiết phục vụ lên kế hoạch chính xác cho phẫu thuật và cấy ghép.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Phẫu thuật siêu âm
              </h3>
              <p className="text-gray-600">
                Sử dụng sóng siêu âm để cắt xương một cách nhẹ nhàng, bảo vệ mô mềm và giúp phục hồi nhanh.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Phẫu thuật có hướng dẫn
              </h3>
              <p className="text-gray-600">
                Cấy ghép răng có hướng dẫn bằng máy tính giúp định vị chính xác và rút ngắn thời gian điều trị.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Chăm Sóc Tận Tâm Cho Các Ca Phức Tạp
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Hãy tin tưởng đội ngũ bác sĩ chuyên môn cao của chúng tôi – luôn tận tâm và chính xác trong từng ca phẫu thuật.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt lịch tư vấn
            </button>
            <button onClick={() => navigate("/#services")} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Tìm hiểu thêm về các thủ thuật
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};
