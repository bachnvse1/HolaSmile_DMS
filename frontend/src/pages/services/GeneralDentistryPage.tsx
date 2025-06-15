import { Link } from 'react-router';
import { Layout } from '../../components/layout/Layout';
import { CheckCircle, Clock, Star, Shield, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router';
import bg1 from '@/assets/bg1.png';
const procedures = [
  "Khám răng miệng toàn diện",
  "Làm sạch răng chuyên nghiệp",
  "Chụp X-quang và hình ảnh răng",
  "Phát hiện và điều trị sâu răng",
  "Điều trị bằng fluoride",
  "Giáo dục về sức khỏe răng miệng",
  "Lập kế hoạch chăm sóc phòng ngừa",
  "Kiểm tra bệnh nướu răng"
];

const benefits = [
  {
    icon: Shield,
    title: "Chăm sóc phòng ngừa",
    description: "Khám định kỳ giúp ngăn ngừa các vấn đề răng miệng nghiêm trọng trước khi chúng phát triển"
  },
  {
    icon: Clock,
    title: "Phát hiện sớm",
    description: "Phát hiện và điều trị sớm khi vấn đề còn đơn giản và chi phí thấp hơn"
  },
  {
    icon: Star,
    title: "Làm sạch chuyên nghiệp",
    description: "Loại bỏ mảng bám và cao răng mà việc đánh răng và dùng chỉ nha khoa thông thường không thể xử lý"
  },
  {
    icon: CheckCircle,
    title: "Giáo dục răng miệng",
    description: "Hướng dẫn kỹ thuật duy trì vệ sinh răng miệng tốt tại nhà"
  }
];

const faqs = [
  {
    question: "Tôi nên đi khám nha sĩ bao lâu một lần?",
    answer: "Chúng tôi khuyên bạn nên đi khám định kỳ 6 tháng một lần để làm sạch và kiểm tra. Một số bệnh nhân có thể cần kiểm tra thường xuyên hơn tùy thuộc vào tình trạng răng miệng."
  },
  {
    question: "Khám định kỳ bao gồm những gì?",
    answer: "Khám tổng quát bao gồm kiểm tra sâu răng, bệnh nướu, tầm soát ung thư miệng, chụp X-quang nếu cần, làm sạch răng chuyên nghiệp và tư vấn chăm sóc răng miệng cá nhân."
  },
  {
    question: "Làm sạch răng có đau không?",
    answer: "Hầu hết bệnh nhân cảm thấy thoải mái. Nếu bạn có răng hoặc nướu nhạy cảm, chúng tôi sẽ sử dụng kỹ thuật và sản phẩm phù hợp để giảm bớt sự khó chịu."
  },
  {
    question: "Một buổi khám răng định kỳ kéo dài bao lâu?",
    answer: "Thường từ 45 đến 60 phút, tùy thuộc vào tình trạng và nhu cầu cá nhân của bạn."
  }
];

export const GeneralDentistryPage = () => {
  const navigate = useNavigate();
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Nha Khoa Tổng Quát
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Chăm sóc răng miệng toàn diện giúp duy trì sức khỏe răng miệng và ngăn ngừa các vấn đề ngay từ đầu. Dịch vụ nha khoa tổng quát là nền tảng của sức khỏe răng miệng tốt.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Đặt lịch hẹn
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                  Gọi +84 (09) 41-120-015
                </button>
              </div>
            </div>
            <div>
              <img
                src={bg1}
                alt="Khám răng tổng quát"
                className="rounded-2xl shadow-2xl w-full h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch vụ bao gồm
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Dịch vụ nha khoa tổng quát toàn diện bao phủ mọi khía cạnh chăm sóc răng định kỳ
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {procedures.map((procedure, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                  <span className="text-gray-900 font-medium">{procedure}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Lợi ích của việc chăm sóc răng định kỳ
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Đầu tư vào chăm sóc răng thường xuyên mang lại lợi ích lâu dài cho sức khỏe và nụ cười của bạn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                    <benefit.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quy trình thăm khám
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { title: "Đăng ký", desc: "Cập nhật tiền sử bệnh và thảo luận về lo ngại hiện tại" },
              { title: "Khám", desc: "Đánh giá sức khỏe răng miệng toàn diện và chụp X-quang nếu cần" },
              { title: "Làm sạch", desc: "Làm sạch răng chuyên nghiệp và điều trị fluoride" },
              { title: "Kế hoạch", desc: "Thảo luận kết quả và lên kế hoạch chăm sóc tiếp theo" }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Sẵn sàng cho lần kiểm tra tiếp theo?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Đừng chờ đợi đến khi có vấn đề. Đặt lịch khám nha khoa định kỳ ngay hôm nay 
            để duy trì nụ cười khỏe mạnh và tươi sáng.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate("/appointment-booking")} className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center">
              <Calendar className="mr-2 h-5 w-5" />
              Đặt lịch hẹn
            </button>
            <Link to ="/#services" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
              Tìm hiểu dịch vụ khác
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};
