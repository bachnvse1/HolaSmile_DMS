import { Linkedin, Twitter, Mail, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { ScheduleCalendar } from '@/components/appointment/ScheduleCalendar';
import { useDentistSchedule } from '@/hooks/useDentistSchedule';

export const TeamSection = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDentist, setSelectedDentist] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const sectionRef = useRef<HTMLElement>(null);
  
  // Load danh sách bác sĩ từ API
  const { dentists, isLoading, error } = useDentistSchedule();
  
  // Auto slide every 5 seconds
  useEffect(() => {
    if (dentists.length > 4) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(dentists.length / 4));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [dentists.length]);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(dentists.length / 4));
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(dentists.length / 4)) % Math.ceil(dentists.length / 4));
  };
  
  const getCurrentDentists = () => {
    const startIndex = currentSlide * 4;
    return dentists.slice(startIndex, startIndex + 4);
  };

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

        {/* Team Grid with Carousel */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Có lỗi xảy ra khi tải danh sách bác sĩ</p>
          </div>
        ) : (
          <div className="relative">
            {/* Dentist Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {getCurrentDentists().map((dentist, index) => (
                <div 
                  key={dentist.id} 
                  className={`text-center group transform transition-all duration-700 hover:scale-105 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                <div className="relative mb-6">
                  <img
                    src={dentist.avatar}
                    alt={dentist.name}
                    className="w-full h-64 object-cover rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {dentist.name}
                </h3>
                <p className="text-blue-600 font-medium mb-3">
                  Bác sĩ Nha khoa
                </p>
                <p className="text-gray-600 text-sm mb-2">
                  Chuyên khoa: Nha khoa tổng quát
                </p>
                <p className="text-gray-500 text-xs mb-4">
                  Bác sĩ chuyên nghiệp với nhiều năm kinh nghiệm
                </p>

                {/* View Schedule Button */}
                <button
                  onClick={() => {
                    setSelectedDentist(dentist);
                    setShowScheduleModal(true);
                  }}
                  className="mb-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center mx-auto"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Xem lịch làm việc
                </button>

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
            
            {/* Navigation and Slide Indicators */}
            {dentists.length > 4 && (
              <div className="flex justify-center items-center mt-8 space-x-6">
                {/* Previous Button */}
                <button
                  onClick={prevSlide}
                  className="bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 hover:shadow-xl border border-gray-200"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                
                {/* Slide Indicators */}
                <div className="flex space-x-2">
                  {Array.from({ length: Math.ceil(dentists.length / 4) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        i === currentSlide ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Next Button */}
                <button
                  onClick={nextSlide}
                  className="bg-white shadow-lg rounded-full p-3 transition-all duration-200 hover:scale-110 hover:shadow-xl border border-gray-200"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>
        )}

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

      {/* Schedule Modal */}
      {showScheduleModal && selectedDentist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden mx-4">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedDentist.avatar}
                    alt={selectedDentist.name}
                    className="w-16 h-16 rounded-full border-4 border-white/20 object-cover"
                  />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedDentist.name}</h2>
                    <p className="text-blue-100">Bác sĩ Nha khoa</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSelectedDentist(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              <ScheduleCalendar
                dentist={selectedDentist}
                currentWeek={currentWeek}
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                onDateSelect={(date: string, timeSlot: string) => {
                  setSelectedDate(date);
                  setSelectedTimeSlot(timeSlot);
                }}
                onPreviousWeek={() => setCurrentWeek(Math.max(0, currentWeek - 1))}
                onNextWeek={() => setCurrentWeek(Math.min(1, currentWeek + 1))}
                mode="view"
                canBookAppointment={false}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};