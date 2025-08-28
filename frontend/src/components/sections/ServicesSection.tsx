import { Smile, Shield, Zap, Heart, Eye, Baby } from 'lucide-react';
import { Link } from 'react-router'
import { useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { useGuestProcedures } from '@/hooks/useGuestProcedures';

const services = [
  {
    icon: Smile,
    title: "Nha Khoa Tổng Quát",
    slug: "general-dentistry",
    description: "Chăm sóc nha khoa toàn diện bao gồm làm sạch, trám và kiểm tra định kỳ để duy trì sức khỏe răng miệng của bạn."
  },
  {
    icon: Shield,
    title: "Chăm Sóc Phòng Ngừa",
    slug: "preventive-care",
    description: "Các phương pháp điều trị và giáo dục phòng ngừa giúp bạn tránh các vấn đề nha khoa trước khi chúng xảy ra."
  },
  {
    icon: Zap,
    title: "Nha Khoa Thẩm Mỹ",
    slug: "cosmetic-dentistry",
    description: "Biến đổi nụ cười của bạn với các dịch vụ làm trắng răng, bọc sứ và các thủ tục thẩm mỹ khác."
  },
  {
    icon: Heart,
    title: "Nha Khoa Phục Hồi",
    slug: "restorative-dentistry",
    description: "Khôi phục răng bị hư hại bằng mão, cầu răng và cấy ghép implant sử dụng công nghệ mới nhất."
  },
  {
    icon: Eye,
    title: "Phẫu Thuật Răng Miệng",
    slug: "oral-surgery",
    description: "Các thủ tục phẫu thuật răng miệng an toàn và thoải mái bao gồm nhổ răng khôn."
  },
  {
    icon: Baby,
    title: "Nha Khoa Nhi Khoa",
    slug: "pediatric-dentistry",
    description: "Chăm sóc nha khoa chuyên biệt cho trẻ em trong môi trường thân thiện và thoải mái."
  }
];

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { data: procedures = [], isLoading: proceduresLoading } = useGuestProcedures();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="services" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dịch Vụ Của Chúng Tôi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Chúng tôi cung cấp đầy đủ các dịch vụ nha khoa để giữ cho nụ cười của bạn luôn khỏe mạnh và đẹp
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className={`bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 flex flex-col h-full ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ 
                transitionDelay: `${index * 100}ms`,
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="bg-blue-100 w-16 h-16 rounded-lg flex items-center justify-center mb-6 transform transition-transform duration-300 hover:rotate-12">
                <service.icon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
                {service.description}
              </p>

              <div className="flex items-center space-x-3 mt-auto">
                <button
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  {expandedIndex === index ? 'Thu lại' : 'Xem danh sách thủ thuật'}
                </button>
                <Link
                  to={`/services/${service.slug}`}
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Chi tiết →
                </Link>
              </div>

              {expandedIndex === index && (
                <div className="mt-6 border-t border-gray-400 pt-4 space-y-3">
                  {proceduresLoading ? (
                    <div className="text-sm text-gray-500">Đang tải thủ thuật...</div>
                  ) : (
                    // Simple filter: match service title words in procedure name or description
                    procedures
                      .filter(p => {
                        const keyword = service.title.toLowerCase();
                        return p.procedureName.toLowerCase().includes(keyword) || (p.description || '').toLowerCase().includes(keyword);
                      })
                      .slice(0, 6)
                      .map(p => (
                        <div key={p.procedureId} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="text-sm text-gray-800">{p.procedureName}</div>
                          <div className="text-sm font-medium text-green-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price ?? 0)}</div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-16 transform transition-all duration-1000 delay-600 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <button 
            onClick={() => navigate("/appointment-booking")} 
            className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
          >
            Đặt Lịch Tư Vấn
          </button>
        </div>
      </div>
    </section>
  );
};