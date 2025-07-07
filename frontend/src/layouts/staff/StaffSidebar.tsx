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
  Activity
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
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({ userRole, isCollapsed }) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

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
      id: 'inventory',
      label: 'Kho Vật Tư',
      icon: <Package className="h-5 w-5" />,
      path: '/inventory',
      roles: ['Administrator', 'Owner', 'Assistant']
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
      label: 'Quản Lý Nhân Viên',
      icon: <UserCheck className="h-5 w-5" />,
      path: '/staff-management',
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
          onClick={() => {
            if (hasChildren) {
              toggleExpand(item.id);
            } else if (item.path) {
              navigate(item.path);
            }
          }}
          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors ${
            level > 0 ? 'pl-8' : ''
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
    <div className={`bg-white shadow-lg h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 border-b">
        {!isCollapsed && (
          <h2 className="text-xl font-bold text-blue-600 h-8">HolaSmile</h2>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto">
        <div className="py-2">
          {menuItems.map(item => renderMenuItem(item))}
        </div>
      </nav>
    </div>
  );
};