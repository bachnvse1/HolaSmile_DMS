import { useState, useEffect, useRef } from 'react';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '@/services/AuthService';
import { NotificationButton } from "@/components/notification/NotificationButton";
import type { UserInfo } from '@/types/user.types';

interface PatientNavigationProps {
  userInfo?: UserInfo;
}

export const PatientNavigation: React.FC<PatientNavigationProps> = ({ userInfo }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const { fullName, logout } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
        try {
          const profile = await AuthService.fetchUserProfile();
          setProfileData(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
    };

    fetchUserProfile();
  }, [userInfo]);

  const getCurrentUserData = () => {
    if (profileData) {
      return {
        name: profileData.fullname || fullName || 'User',
        email: profileData.email || '',
        role: 'Bệnh nhân',
        avatar: profileData.avatar
      };
    }
    return {
      name: fullName || 'User',
      email: '',
      role: 'Bệnh nhân',
      avatar: undefined
    };
  };

  const currentUser = getCurrentUserData();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem('chatbot-messages');
    logout();
    navigate('/');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  const renderUserAvatar = () => {
    if (currentUser.avatar) {
      return (
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    }
    
    return (
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <User className="h-5 w-5 text-white" />
      </div>
    );
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button onClick={() => navigate('/patient/dashboard')} className="flex items-center">
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

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {/* <button 
                onClick={() => navigate('/patient/dashboard')} 
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Trang Chủ
              </button> */}
              <button
                onClick={() => navigate('/patient/appointments')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium"
              >
                Lịch Hẹn
              </button>

              <button
                onClick={() => navigate('/patient/treatment-records')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium"
              >
                Hồ Sơ
              </button>
              <button
                onClick={() => navigate('/patient/orthodontic-treatment-plans')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium"
              >
                Kế Hoạch
              </button>
              <button
                onClick={() => navigate('/invoices')}
                className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-md font-medium"
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

            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition hidden lg:block"
            >
              Đặt Lịch Hẹn
            </button>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100"
              >
                {renderUserAvatar()}
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hidden">
                  <User className="h-5 w-5 text-white" />
                </div>
                
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
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
                    onClick={handleLogout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left border-t border-gray-300"
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
            {/* <button 
              onClick={() => navigate('/patient/dashboard')} 
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Trang Chủ
            </button> */}
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
              Hồ Sơ
            </button>
            <button
              onClick={() => navigate('/patient/orthodontic-treatment-plans')}
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Kế Hoạch
            </button>
            <button
              onClick={() => navigate('/invoices')}
              className="text-gray-900 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
            >
              Hóa Đơn
            </button>
            <div className="border-t pt-4 border-gray-300">
              <button
                onClick={() => navigate('/patient/book-appointment')}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition mb-2"
              >
                Đặt Lịch Hẹn
              </button>

              <div className="flex items-center px-3 py-2">
                {renderUserAvatar()}
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hidden">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/view-profile')}
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