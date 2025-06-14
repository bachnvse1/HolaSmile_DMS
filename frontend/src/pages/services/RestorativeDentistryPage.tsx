import { Layout } from '../../components/layout/Layout';
import { Wrench, Crown, Shield, Clock, CheckCircle, Calendar, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
const restorativeTreatments = [
  {
    icon: Crown,
    title: "Mão Răng",
    description: "Chụp răng được thiết kế riêng giúp bảo vệ răng hư tổn, khôi phục chức năng và thẩm mỹ",
    duration: "2-3 lần hẹn",
    lifespan: "10-15 năm"
  },
  {
    icon: Shield,
    title: "Cầu Răng",
    description: "Thiết bị cố định thay thế răng mất bằng cách nối giữa các răng khỏe mạnh",
    duration: "2-3 lần hẹn",
    lifespan: "10-15 năm"
  },
  {
    icon: Wrench,
    title: "Cấy Ghép Implant",
    description: "Trụ titanium đóng vai trò như chân răng giúp gắn răng giả cố định và lâu dài",
    duration: "3-6 tháng",
    lifespan: "25+ năm"
  },
  {
    icon: Star,
    title: "Điều Trị Tủy",
    description: "Loại bỏ tủy răng bị nhiễm trùng để giữ lại răng thật và phục hồi chức năng",
    duration: "1-2 lần hẹn",
    lifespan: "Trọn đời nếu có mão bảo vệ"
  }
];

const materials = [
  {
    name: "Sứ",
    benefits: ["Thẩm mỹ tự nhiên", "Chống ố màu", "Tương thích sinh học"],
    bestFor: "Phục hình răng cửa"
  },
  {
    name: "Zirconia",
    benefits: ["Cực kỳ cứng", "Không kim loại", "Màu giống răng thật"],
    bestFor: "Phục hình răng hàm"
  },
  {
    name: "Nhựa Composite",
    benefits: ["Chi phí hợp lý", "Sửa chữa trong ngày", "Giữ nguyên mô răng nhiều hơn"],
    bestFor: "Trám răng nhỏ và vừa"
  },
  {
    name: "Hợp Kim Vàng",
    benefits: ["Bền nhất", "Êm với răng đối diện", "Khớp chính xác cao"],
    bestFor: "Phục hình răng hàm"
  }
];

const processSteps = [
  {
    step: 1,
    title: "Tư Vấn & Chẩn Đoán",
    description: "Khám tổng quát, chụp X-quang và lập kế hoạch điều trị"
  },
  {
    step: 2,
    title: "Chuẩn Bị Răng",
    description: "Mài và tạo hình răng để gắn phục hình phù hợp"
  },
  {
    step: 3,
    title: "Lấy Dấu & Gắn Tạm",
    description: "Lấy dấu chính xác và gắn phục hình tạm thời"
  },
  {
    step: 4,
    title: "Chế Tác Tại Labo",
    description: "Phục hình được tạo bởi kỹ thuật viên nha khoa chuyên nghiệp"
  },
  {
    step: 5,
    title: "Gắn Phục Hình",
    description: "Lắp phục hình chính thức, điều chỉnh và cố định lâu dài"
  }
];

const careTips = [
  "Đánh răng và xỉa răng thường xuyên, đúng kỹ thuật",
  "Dùng bàn chải mềm và kem đánh răng không mài mòn",
  "Tránh cắn vật cứng như đá, bút, móng tay",
  "Đeo máng chống nghiến nếu có thói quen nghiến răng",
  "Khám răng định kỳ và vệ sinh chuyên sâu",
  "Không dùng răng mở bao bì hay chai lọ",
  "Đeo máng bảo vệ khi chơi thể thao"
];

const warningSignsData = [
  "Đau hoặc ê buốt kéo dài ở răng phục hình",
  "Nướu sưng hoặc đau quanh răng phục hình",
  "Mão, cầu hoặc trám bị lung lay, rơi ra",
  "Cạnh sắc gây rát lưỡi hoặc má",
  "Cắn lệch hoặc cảm giác khớp cắn thay đổi",
  "Thấy nứt hoặc mẻ trên phục hình"
];

export const RestorativeDentistryPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Phục Hình Răng
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Khôi phục chức năng và thẩm mỹ tự nhiên cho hàm răng.
                Chúng tôi sử dụng vật liệu cao cấp và kỹ thuật hiện đại để phục hình răng hư tổn hoặc đã mất một cách bền vững.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => navigate("/appointment-booking")} className="bg-amber-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center">
                  <Wrench className="mr-2 h-5 w-5" />
                  Khôi phục nụ cười
                </button>
                <button className="border-2 border-amber-600 text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-amber-50 transition-colors">
                  Tư vấn miễn phí
                </button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Phục hình nha khoa"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Restorative Treatments Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Các Phương Pháp Phục Hình
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Giải pháp toàn diện để phục hồi sức khỏe, chức năng và thẩm mỹ của răng
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {restorativeTreatments.map((treatment, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-3 rounded-lg flex-shrink-0">
                    <treatment.icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {treatment.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{treatment.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-gray-600">{treatment.duration}</span>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-amber-600 mr-2" />
                        <span className="text-gray-600">{treatment.lifespan}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vật Liệu Phục Hình Cao Cấp
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chúng tôi sử dụng các vật liệu chất lượng cao nhất để mang lại hiệu quả lâu dài và thẩm mỹ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {materials.map((material, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  {material.name}
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ưu điểm:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {material.benefits.map((benefit, idx) => (
                        <li key={idx}>• {benefit}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Phù hợp nhất với:</h4>
                    <p className="text-sm text-amber-600 font-medium">{material.bestFor}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Process Steps Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quy Trình Phục Hình
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Các bước thực hiện được thiết kế đảm bảo độ chính xác và thoải mái
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-amber-600">{step.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Care Tips Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Chăm Sóc Phục Hình Răng
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Chăm sóc đúng cách giúp phục hình bền đẹp và sử dụng được lâu dài.
              </p>
              <div className="space-y-4">
                {careTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Signs Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Khi Nào Cần Liên Hệ Nha Sĩ
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Nếu bạn gặp bất kỳ dấu hiệu nào sau đây, hãy liên hệ với chúng tôi ngay.
              </p>
              <div className="space-y-4">
                {warningSignsData.map((sign, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="bg-red-100 p-1 rounded-full flex-shrink-0 mt-1">
                      <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    </div>
                    <span className="text-gray-700">{sign}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-amber-50 rounded-lg">
                <h3 className="font-semibold text-amber-900 mb-2">
                  Liên Hệ Khẩn Cấp
                </h3>
                <p className="text-amber-700 text-sm mb-3">
                  Nếu bạn bị đau dữ dội hoặc có tình huống khẩn cấp, đừng chần chừ – hãy gọi cho chúng tôi để được hỗ trợ ngay.
                </p>
                <button className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors">
                  Gọi +84 (09) 41-120-015
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-amber-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Khôi Phục Trọn Vẹn Nụ Cười Của Bạn
          </h2>
          <p className="text-xl text-amber-100 mb-8 max-w-3xl mx-auto">
            Đừng để răng hư tổn hay mất răng làm bạn thiếu tự tin.
            Chúng tôi sẽ giúp bạn lấy lại chức năng và thẩm mỹ một cách tối ưu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt Lịch Tư Vấn
            </button>
            <button onClick={() => navigate("/#services")} className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors">
              Xem các dịch vụ khác
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}