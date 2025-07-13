import { useState } from 'react';
import { User, LogOut, Settings, ChevronDown, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { NotificationButton } from "@/components/notification/NotificationButton"; // cập nhật đúng path của bạn

interface UserInfo {
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface PatientNavigationProps {
  userInfo?: UserInfo; // Make optional since we'll get from hook
}

export const PatientNavigation: React.FC<PatientNavigationProps> = ({ userInfo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { fullName, logout } = useAuth();

  // Use passed userInfo or fallback to auth data
  const displayName = userInfo?.name || fullName || 'User';
  const displayRole = 'Bệnh nhân';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => navigate('/patient/dashboard')}>
              <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">
                HolaSmile
              </h1>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button
                onClick={() => navigate('/patient/dashboard')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Trang Chủ
              </button>
              <button
                onClick={() => navigate('/patient/appointments')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Lịch Hẹn
              </button>
              <button 
                onClick={() => navigate('/patient/treatment-records')} 
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Hồ Sơ Y Tế
              </button>
              <button 
                onClick={() => navigate('/patient/orthodontic-treatment-plans')} 
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Kế Hoạch 
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Hóa Đơn
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Hóa Đơn
              </button>
            </div>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notifications */}
            <div
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full"
              title="Thông báo"
            >
              <NotificationButton />
            </div>

            {/* Book Appointment Button */}
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Đặt Lịch Hẹn
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>                <div className="text-left">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500">{displayRole}</p>
                </div>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={() => navigate('/view-profile')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Thông Tin Cá Nhân
                  </button>
                  <button
                    onClick={() => navigate('/patient/settings')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Cài Đặt
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Đăng Xuất
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Trang Chủ
            </button>
            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Lịch Hẹn
            </button>
            <button 
              onClick={() => navigate('/patient/treatment-records')} 
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Hồ Sơ Y Tế
            </button>
            <button 
              onClick={() => navigate('/patient/orthodontic-treatment-plans')} 
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Điều Trị
            </button>

            <div className="border-t pt-4">
              <button
                onClick={() => navigate('/patient/book-appointment')}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition mb-2"
              >
                Đặt Lịch Hẹn
              </button>

              <div className="flex items-center px-3 py-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-white" />
                </div>                <div>
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="text-xs text-gray-500">{userInfo?.email || 'No email'}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/patient/profile')}
                className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Thông Tin Cá Nhân
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
              >
                Đăng Xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};