import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleNavClick = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/${hash}`);
    } else {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        setTimeout(() => {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <button onClick={handleNavClick('#home')} className="flex items-center">
              <img 
                src="/logo.png" 
                alt="HolaSmile Logo" 
                className="h-14 w-14"
              />
              <div className="flex flex-col items-start leading-none">
                <span className="text-md font-medium text-gray-700 mt-1">NHA KHOA</span>
                <span className="text-xl font-bold text-blue-600 -mt-1">HolaSmile</span>
              </div>
            </button>
          </div>

          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button onClick={handleNavClick('#home')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Trang Chủ
              </button>
              <button onClick={handleNavClick('#services')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Dịch Vụ
              </button>
              <button onClick={handleNavClick('#about')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Về Chúng Tôi
              </button>
              <button onClick={handleNavClick('#team')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Đội Ngũ
              </button>
              <button onClick={handleNavClick('#contact')} className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium">
                Liên Hệ
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-blue-600 border border-gray-300 rounded-lg transition"
            >
              Đăng nhập
            </button>
            <button
              onClick={() => navigate('/appointment-booking')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Đặt lịch hẹn
            </button>
          </div>

          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <button onClick={handleNavClick('#home')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Trang Chủ
            </button>
            <button onClick={handleNavClick('#services')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Dịch Vụ
            </button>
            <button onClick={handleNavClick('#about')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Về Chúng Tôi
            </button>
            <button onClick={handleNavClick('#team')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Đội Ngũ
            </button>
            <button onClick={handleNavClick('#contact')} className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
              Liên Hệ
            </button>
            
            {/* Mobile Action Buttons */}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => navigate('/login')}
                className="w-full px-3 py-2 text-sm font-medium text-gray-700 hover:text-white hover:bg-blue-600 border border-gray-300 rounded-lg transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate('/appointment-booking')}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Đặt lịch hẹn
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
