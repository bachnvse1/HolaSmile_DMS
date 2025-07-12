import { useState } from 'react';
import {
  Home,
  Calendar,
  Users,
  FileText,
  Settings,
  UserCheck,
  TrendingUp,
  Stethoscope,
  CreditCard,
  Package,
  ChevronDown,
  ChevronRight,
  Activity,
  Pill
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  roles: string[];
}

interface StaffSidebarProps {
  userRole: string;
  isCollapsed: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ userRole, isCollapsed, isMobile, onClose }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      toggleExpand(item.id);
    } else if (item.path) {
      navigate(item.path);
      // Close sidebar on mobile after navigation
      if (isMobile && onClose) {
        onClose();
      }
    }
  };

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tổng Quan',
      icon: <Home className="h-5 w-5" />,
      path: '/dashboard',
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
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
          roles: ['Owner', 'Receptionist', 'Dentist']
        }
      ]
    },
    {
      id: 'patients',
      label: 'Bệnh Nhân',
      icon: <Users className="h-5 w-5" />,
      roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist'],
      children: [
        {
          id: 'patients-list',
          label: 'Danh Sách',
          icon: <Users className="h-4 w-4" />,
          path: '/patients',
          roles: ['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']
        },
        {
          id: 'patients-records',
          label: 'Hồ Sơ Y Tế',
          icon: <FileText className="h-4 w-4" />,
          path: '/patients/records',
          roles: ['Administrator', 'Owner', 'Assistant', 'Dentist']
        }
      ]
    },
    {
      id: 'treatments',
      label: 'Điều Trị',
      icon: <Stethoscope className="h-5 w-5" />,
      path: '/treatments',
      roles: ['Administrator', 'Owner', 'Dentist', 'Assistant']
    },
    {
      id: 'prescription-templates',
      label: 'Mẫu Đơn Thuốc',
      icon: <Pill className="h-5 w-5" />,
      path: '/prescription-templates',
      roles: ['Assistant']
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
      roles: ['Administrator', 'Owner', 'Receptionist'],
      children: [
        {
          id: 'finance-invoices',
          label: 'Hóa Đơn',
          icon: <FileText className="h-4 w-4" />,
          path: '/finance/invoices',
          roles: ['Administrator', 'Owner', 'Receptionist']
        },
        {
          id: 'finance-payments',
          label: 'Thanh Toán',
          icon: <CreditCard className="h-4 w-4" />,
          path: '/finance/payments',
          roles: ['Administrator', 'Owner', 'Receptionist']
        }
      ]
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
      roles: ['Administrator', 'Owner', 'Assistant', "Receptionist", 'Dentist'],
    },
    {
      id: 'reports',
      label: 'Báo Cáo',
      icon: <TrendingUp className="h-5 w-5" />,
      roles: ['Administrator', 'Owner'],
      children: [
        {
          id: 'reports-revenue',
          label: 'Doanh Thu',
          icon: <TrendingUp className="h-4 w-4" />,
          path: '/reports/revenue',
          roles: ['Administrator', 'Owner']
        },
        {
          id: 'reports-patients',
          label: 'Bệnh Nhân',
          icon: <Activity className="h-4 w-4" />,
          path: '/reports/patients',
          roles: ['Administrator', 'Owner']
        }
      ]
    },
    {
      id: 'staff-management',
      label: 'Quản Lý Người Dùng',
      icon: <UserCheck className="h-5 w-5" />,
      path: '/administrator/user-list',
      roles: ['Administrator', 'Owner']
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

  const isItemVisible = (item: MenuItem) => {
    return item.roles.includes(userRole);
  };

  const isActiveItem = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!isItemVisible(item)) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.path ? isActiveItem(item.path) : false;

    return (
      <div key={item.id}>
        <button
          onClick={() => handleMenuClick(item)}
          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors ${level > 0 ? 'pl-8' : ''
            } ${isActive ? 'bg-blue-100 text-blue-600 border-r-2 border-blue-600' : 'text-gray-700'}`}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
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
        bg-white shadow-lg transition-all duration-300 ease-in-out
        ${isCollapsed ? (isMobile ? '-translate-x-full' : 'w-16') : 'w-64'}
        h-screen flex flex-col
      `}>
        {/* Header - Fixed */}
        <div className="p-4 border-b flex-shrink-0 h-16 shadow-sm">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-600">HolaSmile</h2>
              {isMobile && (
                <button
                  onClick={onClose}
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Close sidebar"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
          {isCollapsed && !isMobile && (
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
          )}
        </div>

        {/* Navigation - Scrollable */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <div
            style={{
              overflowY: 'scroll',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>
      </div >
    </>
  );
};