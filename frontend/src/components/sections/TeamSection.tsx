import { Linkedin, Twitter, Mail } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import doc1 from '@/assets/doc1.jpg';
import doc2 from '@/assets/doc2.jpg';
export const teamMembers = [
  {
    id: 1,
    name: 'BS. Nguyễn Minh Tuấn',
    role: 'Nha sĩ trưởng & Chuyên gia Implant',
    speciality: 'Phẫu thuật răng miệng, Cấy ghép Implant',
    experience: '15+ năm kinh nghiệm',
    education: 'Thạc sĩ Nha khoa - Đại học Y Hà Nội',
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    description: 'Bác sĩ Tuấn có hơn 15 năm kinh nghiệm trong lĩnh vực nha khoa, chuyên sâu về phẫu thuật và cấy ghép implant.'
  },
  {
    id: 2,
    name: 'BS. Trần Thị Hương',
    role: 'Chuyên gia Nha khoa Thẩm mỹ',
    speciality: 'Thiết kế nụ cười, Veneer, Tẩy trắng răng',
    experience: '12+ năm kinh nghiệm',
    education: 'Thạc sĩ Nha khoa Thẩm mỹ - ĐH Y Tokyo',
    image: doc2,
    description: 'Bác sĩ Hương chuyên về nha khoa thẩm mỹ với nhiều năm đào tạo tại Nhật Bản và kinh nghiệm thực tế phong phú.'
  },
  {
    id: 3,
    name: 'BS. Lê Văn Nam',
    role: 'Chuyên gia Nha khoa Trẻ em',
    speciality: 'Chăm sóc nha khoa trẻ em, Chỉnh nha sớm',
    experience: '10+ năm kinh nghiệm',
    education: 'Thạc sĩ Nha khoa Trẻ em - ĐH Y TP.HCM',
    image: doc1,
    description: 'Bác sĩ Nam có niềm đam mê đặc biệt với việc chăm sóc răng miệng cho trẻ em, tạo môi trường thân thiện và an toàn.'
  },
  {
    id: 4,
    name: 'BS. Phạm Thị Lan',
    role: 'Chuyên gia Chỉnh nha',
    speciality: 'Niềng răng trong suốt, Chỉnh nha Invisalign',
    experience: '8+ năm kinh nghiệm',
    education: 'Thạc sĩ Chỉnh nha - ĐH Y Huế',
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    description: 'Bác sĩ Lan chuyên về chỉnh nha hiện đại, đặc biệt là niềng răng trong suốt Invisalign cho người trưởng thành.'
  }
];

export const TeamSection = () => {
  const navigate = useNavigate();
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
    <section ref={sectionRef} id="team" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Gặp Gỡ Đội Ngũ Của Chúng Tôi
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Đội ngũ chuyên gia nha khoa của chúng tôi tận tâm mang đến dịch vụ chăm sóc chất lượng cao 
            trong một môi trường thoải mái và thân thiện.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div 
              key={index} 
              className={`text-center group transform transition-all duration-700 hover:scale-105 ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="relative mb-6">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {member.name}
              </h3>
              <p className="text-blue-600 font-medium mb-3">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm mb-2">
                {member.speciality}
              </p>
              <p className="text-gray-500 text-xs mb-4">
                {member.education}
              </p>

              {/* Social Links */}
              <div className="flex justify-center space-x-3">
                <a
                  href="#"
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="#"
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors transform hover:scale-110"
                  aria-label="Email"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className={`text-center mt-16 transform transition-all duration-1000 delay-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <div className="bg-blue-50 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Đặt Lịch Hẹn Ngay Hôm Nay
            </h3>
            <p className="text-gray-600 mb-6">
              Chúng tôi sẵn sàng giúp bạn có nụ cười khỏe mạnh và rạng rỡ. 
              Hãy đặt lịch hẹn với chúng tôi để trải nghiệm dịch vụ chăm sóc nha khoa tốt nhất.
            </p>
            <button 
              onClick={() => navigate("/appointment-booking")} 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              Đặt Lịch Tư Vấn
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};