import { useAuth } from '../../hooks/useAuth';
import { Users, Calendar, TrendingUp, AlertCircle, Clock, CreditCard } from 'lucide-react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';

export const StaffDashboard = () => {
  const { fullName, role, userId } = useAuth();

  // Create userInfo object for StaffLayout
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '', // Will be filled from API if needed
    role: role || '',
    avatar: undefined
  };

  const getRoleSpecificStats = () => {
    switch (role) {
      case 'Administrator':
      case 'Owner':
        return {
          title: 'Tổng Quan Hệ Thống',
          stats: [
            { label: 'Tổng Bệnh Nhân', value: '1,245', icon: Users, color: 'blue' },
            { label: 'Lịch Hẹn Hôm Nay', value: '32', icon: Calendar, color: 'green' },
            { label: 'Doanh Thu Tháng', value: '125M', icon: TrendingUp, color: 'purple' },
            { label: 'Cần Xử Lý', value: '8', icon: AlertCircle, color: 'red' }
          ]
        };
      case 'Dentist':
        return {
          title: 'Lịch Làm Việc',
          stats: [
            { label: 'Bệnh Nhân Hôm Nay', value: '12', icon: Users, color: 'blue' },
            { label: 'Lịch Hẹn Tuần', value: '48', icon: Calendar, color: 'green' },
            { label: 'Giờ Làm Việc', value: '8h', icon: Clock, color: 'purple' },
            { label: 'Cần Tư Vấn', value: '3', icon: AlertCircle, color: 'red' }
          ]
        };
      case 'Receptionist':
        return {
          title: 'Tiếp Đón & Lịch Hẹn',
          stats: [
            { label: 'Check-in Hôm Nay', value: '28', icon: Users, color: 'blue' },
            { label: 'Lịch Hẹn Mới', value: '15', icon: Calendar, color: 'green' },
            { label: 'Thanh Toán', value: '850K', icon: CreditCard, color: 'purple' },
            { label: 'Chờ Xử Lý', value: '5', icon: AlertCircle, color: 'red' }
          ]
        };
      case 'Assistant':
        return {
          title: 'Hỗ Trợ Điều Trị',
          stats: [
            { label: 'Bệnh Nhân Hỗ Trợ', value: '18', icon: Users, color: 'blue' },
            { label: 'Thủ Thuật Hoàn Thành', value: '25', icon: Calendar, color: 'green' },
            { label: 'Giờ Hỗ Trợ', value: '7.5h', icon: Clock, color: 'purple' },
            { label: 'Cần Chuẩn Bị', value: '4', icon: AlertCircle, color: 'red' }
          ]
        };
      default:
        return {
          title: 'Dashboard',
          stats: []
        };
    }
  };

  const { title, stats } = getRoleSpecificStats();
  
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  };  return (
    <StaffLayout userInfo={userInfo}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600">
            Chào mừng trở lại, {fullName} - {role}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{stat.label}</h3>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Nhiệm Vụ Hôm Nay</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Meeting với team</p>
                  <p className="text-sm text-gray-600">09:00 - 10:00</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Khám bệnh nhân VIP</p>
                  <p className="text-sm text-gray-600">14:00 - 15:30</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông Báo</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Cập nhật hệ thống</p>
                  <p className="text-sm text-gray-600">Hệ thống sẽ bảo trì vào 23:00</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Lịch hẹn cần xác nhận</p>
                  <p className="text-sm text-gray-600">5 lịch hẹn đang chờ xác nhận</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};