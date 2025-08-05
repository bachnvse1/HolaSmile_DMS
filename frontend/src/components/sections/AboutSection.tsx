import { CheckCircle, Clock, Shield, Heart } from 'lucide-react';
import { Link } from 'react-router';
import bg2 from '@/assets/bg2.jpg';
import bg3 from '@/assets/bg3.jpg';
import bg4 from '@/assets/bg4.jpg';
import bg5 from '@/assets/bg5.jpg';
import { useEffect, useState, useRef } from 'react';

const features = [
  {
    icon: CheckCircle,
    title: "Công Nghệ Tiên Tiến",
    description: "Trang thiết bị và kỹ thuật nha khoa mới nhất cho điều trị chính xác và thoải mái"
  },
  {
    icon: Clock,
    title: "Lịch Hẹn Linh Hoạt",
    description: "Thời gian hẹn thuận tiện phù hợp với lịch trình bận rộn của bạn"
  },
  {
    icon: Shield,
    title: "Chăm Sóc Toàn Diện",
    description: "Dịch vụ nha khoa toàn diện dưới một mái nhà cho cả gia đình bạn"
  },
  {
    icon: Heart,
    title: "Cách Tiếp Cận Tập Trung Vào Bệnh Nhân",
    description: "Kế hoạch điều trị cá nhân hóa phù hợp với nhu cầu và mục tiêu riêng của bạn"
  }
];

export const AboutSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section ref={sectionRef} id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transform transition-all duration-1000 ${
            isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
          }`}>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Về HolaSmile
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Trong hơn 5 năm qua, HolaSmile đã cung cấp các dịch vụ nha khoa tuyệt vời 
                cho cộng đồng của chúng tôi. Chúng tôi kết hợp công nghệ tiên tiến với sự chăm sóc 
                đầy tình cảm để đảm bảo mỗi bệnh nhân nhận được phương pháp điều trị tốt nhất có thể.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Sứ mệnh của chúng tôi là giúp bạn đạt được và duy trì sức khỏe răng miệng tối ưu đồng thời tạo ra những nụ cười đẹp giúp bạn tự tin hơn và cải thiện chất lượng cuộc sống.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-4 transform transition-all duration-500 hover:scale-105 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0 transform transition-transform duration-300 hover:rotate-12">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-1000 delay-300 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}>
              <Link to="/learn-more"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-center"
              >
                Tìm Hiểu Thêm
              </Link>
              <Link to='/learn-more' className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105">
                Xem thông tin của chúng tôi
              </Link>
            </div>
          </div>

          {/* Right Content - Images */}
          <div className={`relative transform transition-all duration-1000 delay-200 ${
            isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'
          }`}>
            <div className="grid grid-cols-2 gap-4">
              <img
                src={bg2}
                alt="Dental equipment"
                className="rounded-lg h-48 w-full object-cover transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              />
              <img
                src={bg3}
                alt="Dental office"
                className="rounded-lg h-48 w-full object-cover mt-8 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              />
              <img
                src={bg4}
                alt="Happy patient"
                className="rounded-lg h-48 w-full object-cover -mt-8 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              />
              <img
                src={bg5}
                alt="Dental consultation"
                className="rounded-lg h-48 w-full object-cover transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};