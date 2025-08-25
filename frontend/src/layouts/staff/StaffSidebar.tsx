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
  Phone,
  Bot,
  WrenchIcon
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
import { useChatHub } from '@/components/chat/ChatHubProvider';
import { useChatConversations } from '@/hooks/chat/useChatConversations';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles: string[];
  element?: React.ReactNode;
  unreadCount?: number;
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

  const handleLogoClick = () => {
    if (!isMobile && onToggle) {
      onToggle();
    }
  };

  const { userId } = useAuth();
  const { getTotalUnreadCount, refreshUnreadCounts, unreadCounts } = useUnreadMessages(userId);
  const { isConnected, messages } = useChatHub();

  const { conversations } = useChatConversations();
  const messageStats = useMemo(() => {
    if (!conversations || !unreadCounts || unreadCounts.length === 0) {
      return {
        internal: 0,
        patientConsultation: 0,
        guestConsultation: 0
      };
    }

    let internal = 0;
    let patientConsultation = 0;
    let guestConsultation = 0;

    unreadCounts.forEach(unread => {
      const conversation = conversations.find(conv => conv.userId === unread.senderId);
      if (conversation) {
        switch (conversation.role.toLowerCase()) {
          case 'administrator':
          case 'owner':
          case 'receptionist':
          case 'assistant':
          case 'dentist':
            internal += unread.unreadCount;
            break;
          case 'patient':
            patientConsultation += unread.unreadCount;
            break;
          case 'guest':
            guestConsultation += unread.unreadCount;
            break;
          default:
            internal += unread.unreadCount;
            break;
        }
      } else guestConsultation += unread.unreadCount;
    });

    return {
      internal,
      patientConsultation,
      guestConsultation
    };
  }, [conversations, unreadCounts]);

  useEffect(() => {
    if (!userId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];

    if (lastMessage.receiverId === userId && lastMessage.senderId !== userId) {
      const timer = setTimeout(() => {
        refreshUnreadCounts();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages, userId, refreshUnreadCounts]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      refreshUnreadCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refreshUnreadCounts]);

  useEffect(() => {
    if (userId) {
      refreshUnreadCounts();
    }
  }, [userId, refreshUnreadCounts]);

  const totalUnreadCount = getTotalUnreadCount();


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
      roles: ['Owner', 'Receptionist', 'Assistant', 'Dentist'],
      children: [
        {
          id: 'appointments-calendar',
          label: 'Lịch Hẹn',
          icon: <Calendar className="h-4 w-4" />,
          path: '/appointments',
          roles: ['Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'appointments-manage',
          label: 'Quản Lý Lịch',
          icon: <UserCheck className="h-4 w-4" />,
          path: '/schedules',
          roles: ['Owner', 'Receptionist', 'Dentist', 'Assistant']
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
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
          unreadCount: messageStats.internal
        },
        {
          id: 'messages-patient-consultation',
          label: 'Tư Vấn Bệnh Nhân',
          icon: <UserCircle className="h-4 w-4" />,
          path: '/messages/patient-consultation',
          roles: ['Owner', 'Receptionist', 'Assistant', 'Dentist'],
          unreadCount: messageStats.patientConsultation
        },
        {
          id: 'messages-customer-consultation',
          label: 'Tư Vấn Khách Hàng',
          icon: <Phone className="h-4 w-4" />,
          path: '/messages/guest-consultation',
          roles: ['Receptionist'],
          unreadCount: messageStats.guestConsultation
        }
      ]
    },
    {
      id: 'patients',
      label: 'Bệnh Nhân',
      icon: <Users className="h-5 w-5" />,
      path: '/patients',
      roles: ['Owner', 'Receptionist', 'Assistant', 'Dentist'],
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
      roles: ['Assistant', 'Dentist']
    },
    {
      id: "procedures",
      label: "Thủ Thuật",
      icon: <Stethoscope className="h-5 w-5" />,
      path: "/proceduces",
      roles: ['Owner', 'Receptionist', 'Assistant', 'Dentist']
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
      id: 'chatbot-management',
      label: 'Quản Lý Chatbot',
      icon: <Bot className="h-5 w-5" />,
      path: '/chatbot/knowledge',
      roles: ['Owner']
    },
    {
      id: 'maintenance',
      label: "Quản lý bảo trì",
      path: "/maintenance",
      icon: <WrenchIcon className="h-5 w-5" />,
      roles: ['Receptionist']
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
        // {
        //   id: 'settings-system',
        //   label: 'Hệ Thống',
        //   icon: <Settings className="h-4 w-4" />,
        //   path: '/settings/system',
        //   roles: ['Administrator', 'Owner']
        // }
      ]
    }
  ], [messageStats]);

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

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-items', JSON.stringify(expandedItems));
  }, [expandedItems]);

  useEffect(() => {
    const currentPath = location.pathname;

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
  }, [location.pathname, expandedItems, menuItems]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

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
    const hasUnreadMessages = (item.unreadCount || 0) > 0;

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
              {isMessagesItem && getTotalUnreadCount() > 0 && (
                <div className="absolute -top-2 -right-2">
                  <div
                    className="absolute inset-0 w-5 h-5 rounded-full bg-red-500"
                    style={{ animation: 'ripple 1.5s ease-out infinite' }}
                  />
                  <div
                    className="relative w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    title={`${getTotalUnreadCount()} tin nhắn chưa đọc`}
                    style={{ animation: 'pulse 2s ease-in-out infinite' }}
                  >
                    <span className="text-[10px] text-white font-bold">
                      {getTotalUnreadCount() > 9 ? '9+' : getTotalUnreadCount()}
                    </span>
                  </div>
                </div>
              )}

              {!isMessagesItem && hasUnreadMessages && level > 0 && (
                <div className="absolute -top-2 -right-2">
                  <div
                    className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                    title={`${item.unreadCount} tin nhắn chưa đọc`}
                  >
                    <span className="text-[9px] text-white font-bold">
                      {(item.unreadCount || 0) > 9 ? '9+' : item.unreadCount}
                    </span>
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">{item.label}</span>
                {!isMessagesItem && hasUnreadMessages && level > 0 && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {(item.unreadCount || 0) > 99 ? '99+' : item.unreadCount}
                    </span>
                  </div>
                )}
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
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-opacity-30 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed left-0 top-0 z-50' : 'fixed left-0 top-0 z-30'}
        bg-white transition-all duration-300 ease-in-out
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
          <div >
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