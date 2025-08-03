import { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Calendar,
  Users,
  FileText,
  Settings,
  UserCheck,
  Stethoscope,
  CreditCard, 
  Package,
  ChevronDown,
  ChevronRight,
  Activity,
  Pill,
  ChevronLeft,
  Percent,
  ArrowLeftRight,
  MessageCircle,
  Users2,
  UserCircle,
  Phone
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
import { useChatHub } from '@/components/chat/ChatHubProvider';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles: string[];
  element?: React.ReactNode;
}

interface StaffSidebarProps {
  userRole: string;
  isCollapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ userRole, isCollapsed, isMobile, onClose, onToggle }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: <Home className="h-5 w-5" />,
      path: '/dashboard',
      roles: ['Owner']
    },
    {
      id: 'appointments',
      label: 'Lịch Hẹn',
      icon: <Calendar className="h-5 w-5" />,
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
      children: [
        {
          id: 'appointments-calendar',
          label: 'Lịch Hẹn',
          icon: <Calendar className="h-4 w-4" />,
          path: '/appointments',
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'appointments-manage',
          label: 'Quản Lý Lịch',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/schedules',
          roles: ['Owner', 'Receptionist', 'Dentist', 'Assistant', 'Administrator']
        }
      ]
    },
    {
      id: 'messages',
      label: 'Tin Nhắn',
      icon: <MessageCircle className="h-5 w-5" />,
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
      children: [
        {
          id: 'messages-internal',
          label: 'Tin Nhắn Nội Bộ',
          icon: <Users2 className="h-4 w-4" />,
          path: '/messages/internal',
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'messages-patient-consultation',
          label: 'Tư Vấn Bệnh Nhân',
          icon: <UserCircle className="h-4 w-4" />,
          path: '/messages/patient-consultation',
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'messages-customer-consultation',
          label: 'Tư Vấn Khách Hàng',
          icon: <Phone className="h-4 w-4" />,
          path: '/messages/guest-consultation',
          roles: ['Receptionist']
        }
      ]
    },
    {
      id: 'patients',
      label: 'Bệnh Nhân',
      icon: <Users className="h-5 w-5" />,
      path: '/patients',
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
    },
    {
      id: 'prescription-templates',
      label: 'Mẫu Đơn Thuốc',
      icon: <Pill className="h-5 w-5" />,
      path: '/prescription-templates',
      roles: ['Assistant', 'Dentist']
    },
    {
      id: 'assigned-tasks',
      label: 'Công Việc Được Giao',
      icon: <Activity className="h-5 w-5" />,
      path: '/assistant/assigned-tasks',
      roles: ['Assistant']
    },
    {
      id: 'warranty',
      label: 'Bảo Hành',
      icon: <FileText className="h-5 w-5" />,
      path: '/assistant/warranty-cards',
      roles: ['Assistant']
    },
    {
      id: 'finance',
      label: 'Tài Chính',
      icon: <CreditCard className="h-5 w-5" />,
      roles: ['Owner', 'Receptionist'],
      children: [
        {
          id: 'finance-transactions',
          label: 'Giao Dịch',
          icon: <ArrowLeftRight className="h-4 w-4" />,
          path: '/financial-transactions',
          roles: ['Owner', 'Receptionist']
        },
        {
          id: 'finance-invoices',
          label: 'Hóa Đơn',
          icon: <FileText className="h-4 w-4" />,
          path: '/invoices',
          roles: ['Receptionist', 'Owner']
        },
      ]
    },
    {
      id: 'instruction-templates',
      label: 'Mẫu Chỉ Dẫn',
      icon: <FileText className="h-5 w-5" />,
      path: '/instruction-templates',
      roles: [ 'Assistant', 'Dentist']
    },
    {
      id: "procedures",
      label: "Thủ Thuật",
      icon: <Stethoscope className="h-5 w-5" />,
      path: "/proceduces",
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
    },
    {
      id: 'inventory',
      label: 'Kho Vật Tư',
      icon: <Package className="h-5 w-5" />,
      path: '/inventory',
      roles: ['Owner', 'Assistant', "Receptionist", 'Dentist'],
    },
    {
      id: 'promotions',
      label: 'Khuyến Mãi',
      icon: <Percent className="h-5 w-5" />,
      path: '/promotions',
      roles: ['Receptionist', 'Owner', 'Assistant', 'Dentist']
    },
    {
      id: 'staff-management',
      label: 'Quản Lý Người Dùng',
      icon: <UserCheck className="h-5 w-5" />,
      path: '/administrator/user-list',
      roles: ['Administrator']
    },
    {
      id: 'settings',
      label: 'Cài Đặt',
      icon: <Settings className="h-5 w-5" />,
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
      children: [
        {
          id: 'settings-profile',
          label: 'Hồ Sơ Cá Nhân',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/view-profile',
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'settings-system',
          label: 'Hệ Thống',
          icon: <Settings className="h-4 w-4" />,
          path: '/settings/system',
          roles: ['Administrator', 'Owner']
        }
      ]
    }
  ], []);

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const savedExpandedItems = localStorage.getItem('sidebar-expanded-items');
    if (savedExpandedItems) {
      try {
        const parsed = JSON.parse(savedExpandedItems);
        if (Array.isArray(parsed)) {
          setExpandedItems(parsed);
        }
      } catch (error) {
        console.error('Error parsing saved sidebar state:', error);
      }
    }
  }, []);

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
  }, [expandedItems]);

  // Auto-expand parent items based on current route
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Find which parent item should be expanded based on current path
    const findParentForPath = (): string | null => {
      for (const item of menuItems) {
        if (item.children) {
          for (const child of item.children) {
            if (child.path && (currentPath === child.path || currentPath.startsWith(child.path + '/'))) {
              return item.id;
            }
          }
        }
      }
      return null;
    };

    const parentId = findParentForPath();
    if (parentId && !expandedItems.includes(parentId)) {
      setExpandedItems(prev => {
        if (!prev.includes(parentId)) {
          return [...prev, parentId];
        }
        return prev;
      });
    }
  }, [location.pathname]); // Removed menuItems and expandedItems from dependencies

  const handleLogoClick = () => {
    if (!isMobile && onToggle) {
      onToggle();
    }
  };

  const { userId } = useAuth();
  const { getTotalUnreadCount, refreshUnreadCounts } = useUnreadMessages(userId);
  const { isConnected, messages } = useChatHub();
  
  
  // Force refresh unread counts khi có tin nhắn mới trong ChatHub
  useEffect(() => {
    if (!userId || messages.length === 0) return;
    
    const lastMessage = messages[messages.length - 1];
    
    // Chỉ refresh nếu tin nhắn đến cho user hiện tại (không phải từ user hiện tại)
    if (lastMessage.receiverId === userId && lastMessage.senderId !== userId) {
      // Delay để backend có thời gian xử lý
      const timer = setTimeout(() => {
        refreshUnreadCounts();
      }, 1000); // Tăng delay lên 1 giây
      
      return () => clearTimeout(timer);
    }
  }, [messages, userId, refreshUnreadCounts]);
  
  // Periodic refresh mỗi 30 giây để đảm bảo sync
  useEffect(() => {
    if (!userId) return;
    
    const interval = setInterval(() => {
      refreshUnreadCounts();
    }, 30000); // 30 giây
    
    return () => clearInterval(interval);
  }, [userId, refreshUnreadCounts]);
  
  // Refresh khi user thay đổi hoặc component mount
  useEffect(() => {
    if (userId) {
      refreshUnreadCounts();
    }
  }, [userId, refreshUnreadCounts]);

  // Refresh unread counts khi user visit message pages để cập nhật badge
  useEffect(() => {
    if (!userId) return;

    // Các routes tin nhắn cần theo dõi
    const messageRoutes = [
      '/messages/internal',
      '/messages/patient-consultation', 
      '/messages/guest-consultation'
    ];

    const isOnMessagePage = messageRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    if (isOnMessagePage) {
      // Delay nhỏ để đảm bảo trang đã load và có thể mark messages as read
      const timer = setTimeout(() => {
        refreshUnreadCounts();
      }, 2000); // 2 giây để đảm bảo trang đã load hoàn tất

      return () => clearTimeout(timer);
    }
  }, [location.pathname, userId, refreshUnreadCounts]);

  // Refresh ngay khi có focus/visibility change để cập nhật realtime
  useEffect(() => {
    if (!userId) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshUnreadCounts();
      }
    };

    const handleFocus = () => {
      refreshUnreadCounts();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, refreshUnreadCounts]);
  
  const totalUnreadCount = getTotalUnreadCount();

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const newItems = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Save to localStorage immediately
      localStorage.setItem('sidebar-expanded-items', JSON.stringify(newItems));
      return newItems;
    });
  };

  // Function to clear all expanded items (useful for reset)
  // const clearExpandedItems = () => {
  //   setExpandedItems([]);
  //   localStorage.removeItem('sidebar-expanded-items');
  // };

  const isItemVisible = (item: MenuItem): boolean => {
    return item.roles.includes(userRole);
  };

  const isActiveItem = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpand(item.id);
    } else if (item.path) {
      navigate(item.path);
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!isItemVisible(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path ? isActiveItem(item.path) : false;
    const isMessagesItem = item.id === 'messages';

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors ${level > 0 ? 'pl-8' : ''
            } ${isActive ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'}`}
        >
          <div className="flex items-center space-x-3">
            <div className="relative">
              {item.icon}
              {/* REALTIME BADGE - với logging */}
                                    {isMessagesItem && totalUnreadCount > 0 && (
                    <div className="absolute -top-2 -right-2">
                      {/* Ripple effect background */}
                      <div 
                        className="absolute inset-0 w-5 h-5 rounded-full bg-red-500"
                        style={{
                          animation: 'ripple 1.5s ease-out infinite'
                        }}
                      />
                      {/* Main badge */}
                      <div 
                        className="relative w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                        title={`${totalUnreadCount} tin nhắn chưa đọc`}
                        style={{
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      >
                        <span className="text-[10px] text-white font-bold">
                          {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                        </span>
                      </div>
                      
                      <style>{`
                        @keyframes ripple {
                          0% {
                            transform: scale(1);
                            opacity: 1;
                          }
                          70% {
                            transform: scale(2.5);
                            opacity: 0.3;
                          }
                          100% {
                            transform: scale(3);
                            opacity: 0;
                          }
                        }
                        
                        @keyframes pulse {
                          0%, 100% {
                            transform: scale(1);
                            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
                          }
                          50% {
                            transform: scale(1.1);
                            box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
                          }
                        }
                      `}</style>
                    </div>
                  )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
              </div>
            )}
          </div>
          {!isCollapsed && hasChildren && (
            <div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>

        {!isCollapsed && hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay - Prevent interaction with content behind */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-opacity-30 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed left-0 top-0 z-50' : 'fixed left-0 top-0 z-30'}
        bg-white ${isMobile ? 'transition-transform duration-300' : 'transition-all duration-300 ease-in-out'}
        ${isCollapsed ? (isMobile ? '-translate-x-full' : 'w-16') : 'w-64'}
        h-screen flex flex-col
      `}>
        {/* Header - Fixed */}
        <div className="p-4 flex-shrink-0 h-16 border-b border-gray-300">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600 cursor-pointer" onClick={handleLogoClick}>
                HolaSmile
              </h2>
              <div className="flex items-center space-x-2">
                {isMobile && (
                  <button
                    onClick={onClose}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Close sidebar"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {!isMobile && onToggle && (
                  <button
                    onClick={onToggle}
                    className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Collapse sidebar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div
              className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              onClick={handleLogoClick}
              title="Expand sidebar"
            >
              <span className="text-white font-bold text-sm">HS</span>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-1">
            {menuItems.map(item => renderMenuItem(item))}

            {/* Expand button when collapsed (non-mobile) */}
            {isCollapsed && !isMobile && onToggle && (
              <button
                onClick={onToggle}
                className="w-full flex items-center justify-center px-4 py-3 pl-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </nav>
        <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center">
            <div>Version 1.0.0</div>
            {/* DEBUG INFO - SỬ DỤNG useUnreadMessages */}
            <div className="mt-1">
              Messages: {totalUnreadCount} | 🟢 "Online"
            </div>
          </div>
        )}
      </div>
      </div >
    </>
  );
};