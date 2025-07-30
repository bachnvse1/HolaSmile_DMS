import { useState } from 'react';
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
import { useUnreadMessages } from '@/hooks/chat/useUnreadMessages';
import { useAuth } from '@/hooks/useAuth';
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
  
  // 🔥 SỬ DỤNG HOOK CÓ SẴN
  const { userId } = useAuth();
  const { getTotalUnreadCount } = useUnreadMessages(userId);
  const { isConnected } = useChatHub();
  
  // Lấy total unread count
  const totalUnreadCount = getTotalUnreadCount();

  const menuItems: MenuItem[] = [
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
  ];

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
              {/* 🔥 REALTIME BADGE KHI COLLAPSED - sử dụng useUnreadMessages */}
              {isMessagesItem && totalUnreadCount > 0 && (
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                  isConnected ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                }`}>
                  <span className="text-[8px] text-white font-bold">
                    {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  </span>
                </div>
              )}
              {/* Connection indicator khi offline */}
              {isMessagesItem && !isConnected && (
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-400 rounded-full" title="Offline"></div>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.label}</span>
                {/* 🔥 REALTIME BADGE KHI EXPANDED - sử dụng useUnreadMessages */}
                {isMessagesItem && totalUnreadCount > 0 && (
                  <div className={`text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] flex items-center justify-center ${
                    isConnected ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                  }`}>
                    {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                  </div>
                )}
                {/* Connection status text */}
                {isMessagesItem && !isConnected && (
                  <span className="text-xs text-gray-400">(Offline)</span>
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
    <aside
      className={`
        bg-white border-r border-gray-200 transition-all duration-300 flex flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobile 
          ? 'fixed inset-y-0 left-0 z-50' 
          : 'relative'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HS</span>
            </div>
            <span className="font-bold text-gray-900">HolaSmile</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-gray-500 text-center">
            <div>Version 1.0.0</div>
            {/* 🔥 DEBUG INFO - SỬ DỤNG useUnreadMessages */}
            <div className="mt-1">
              Messages: {totalUnreadCount} | {isConnected ? '🟢 Online' : '🔴 Offline'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};