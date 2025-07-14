import { Users, Calendar, TrendingUp, AlertCircle, Clock, CreditCard, DollarSign, UserCheck, Activity, Target } from 'lucide-react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { useUserInfo } from '@/hooks/useUserInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useMemo, memo } from 'react';

// Memoized Chart Components to prevent re-render lag
const RevenueChart = memo(({ data }: { data: Array<{ month: string, revenue: number, appointments: number }> }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="revenue" fill="#3b82f6" name="Doanh thu (triệu)" />
      <Bar dataKey="appointments" fill="#10b981" name="Lịch hẹn" />
    </BarChart>
  </ResponsiveContainer>
));
RevenueChart.displayName = 'RevenueChart';

const ServicePieChart = memo(({ data }: { data: Array<{ name: string, value: number, color: string }> }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
));
ServicePieChart.displayName = 'ServicePieChart';

const WeeklyLineChart = memo(({ data }: { data: Array<{ day: string, appointments: number }> }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="appointments"
        stroke="#8b5cf6"
        strokeWidth={3}
        dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
      />
    </LineChart>
  </ResponsiveContainer>
));
WeeklyLineChart.displayName = 'WeeklyLineChart';

export const StaffDashboard = () => {
  const userInfo = useUserInfo();

  // Memoize chart data to prevent recalculation
  const chartData = useMemo(() => ({
    monthlyRevenue: [
      { month: 'T1', revenue: 85, appointments: 120 },
      { month: 'T2', revenue: 92, appointments: 135 },
      { month: 'T3', revenue: 78, appointments: 110 },
      { month: 'T4', revenue: 105, appointments: 150 },
      { month: 'T5', revenue: 125, appointments: 180 },
      { month: 'T6', revenue: 118, appointments: 165 },
    ],
    serviceDistribution: [
      { name: 'Tổng quát', value: 35, color: '#0088FE' },
      { name: 'Thẩm mỹ', value: 25, color: '#00C49F' },
      { name: 'Nha chu', value: 20, color: '#FFBB28' },
      { name: 'Nội nha', value: 15, color: '#FF8042' },
      { name: 'Khác', value: 5, color: '#8884d8' },
    ],
    weeklyAppointments: [
      { day: 'T2', appointments: 45 },
      { day: 'T3', appointments: 52 },
      { day: 'T4', appointments: 38 },
      { day: 'T5', appointments: 61 },
      { day: 'T6', appointments: 48 },
      { day: 'T7', appointments: 35 },
      { day: 'CN', appointments: 25 },
    ]
  }), []);

  const getRoleSpecificStats = () => {
    switch (userInfo.role) {
      case 'Administrator':
      case 'Owner':
        return {
          title: 'Tổng Quan Hệ Thống',
          stats: [
            {
              label: 'Tổng Doanh Thu Tháng',
              value: '20 triệu',
              change: '+12.5%',
              icon: DollarSign,
              color: 'blue',
              trend: 'up'
            },
            {
              label: 'Tổng Bệnh Nhân',
              value: '25',
              change: '+8.2%',
              icon: Users,
              color: 'green',
              trend: 'up'
            },
            {
              label: 'Lịch Hẹn Tháng Này',
              value: '32',
              change: '+15.3%',
              icon: Calendar,
              color: 'purple',
              trend: 'up'
            },
            {
              label: 'Tỷ Lệ Hài Lòng',
              value: '96.8%',
              change: '+2.1%',
              icon: Target,
              color: 'orange',
              trend: 'up'
            }
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
      red: 'bg-red-100 text-red-600',
      orange: 'bg-orange-100 text-orange-600'
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  };

  // Owner Dashboard with advanced charts
  if (userInfo.role === 'Administrator' || userInfo.role === 'Owner') {
    return (
      <StaffLayout userInfo={userInfo}>
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-gray-900">
                {title}
              </CardTitle>
              <CardDescription className="text-lg">
                Chào mừng trở lại, {userInfo.name}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue and Appointments Chart */}
            <Card className="will-change-transform">
              <CardHeader>
                <CardTitle>Doanh Thu & Lịch Hẹn (6 Tháng)</CardTitle>
                <CardDescription>
                  Theo dõi xu hướng doanh thu và số lượng lịch hẹn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart data={chartData.monthlyRevenue} />
              </CardContent>
            </Card>

            {/* Service Distribution Pie Chart */}
            <Card className="will-change-transform">
              <CardHeader>
                <CardTitle>Phân Bố Dịch Vụ</CardTitle>
                <CardDescription>
                  Tỷ lệ các loại dịch vụ được sử dụng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServicePieChart data={chartData.serviceDistribution} />
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Appointments Line Chart */}
            <Card className="lg:col-span-2 will-change-transform">
              <CardHeader>
                <CardTitle>Lịch Hẹn Theo Tuần</CardTitle>
                <CardDescription>
                  Xu hướng lịch hẹn trong tuần
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyLineChart data={chartData.weeklyAppointments} />
              </CardContent>
            </Card>

            {/* Progress Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Tiến Độ Tháng Này</CardTitle>
                <CardDescription>
                  Đạt được so với mục tiêu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Doanh thu</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Lịch hẹn</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Bệnh nhân mới</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Hài lòng</span>
                    <span>96%</span>
                  </div>
                  <Progress value={96} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Activities and Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt Động Gần Đây</CardTitle>
                <CardDescription>
                  Các sự kiện quan trọng trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Thanh toán mới</p>
                      <p className="text-sm text-gray-600">Bệnh nhân Nguyễn Văn A - 2,500,000 VNĐ</p>
                      <p className="text-xs text-gray-500">5 phút trước</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <Users className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Bệnh nhân mới đăng ký</p>
                      <p className="text-sm text-gray-600">Trần Thị B - Khám tổng quát</p>
                      <p className="text-xs text-gray-500">15 phút trước</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Lịch hẹn được đặt</p>
                      <p className="text-sm text-gray-600">Lê Văn C - Niềng răng</p>
                      <p className="text-xs text-gray-500">30 phút trước</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cảnh Báo & Thông Báo</CardTitle>
                <CardDescription>
                  Các vấn đề cần chú ý
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Thiết bị cần bảo trì</p>
                      <p className="text-sm text-gray-600">Máy X-quang phòng 2 cần kiểm tra</p>
                      <Badge variant="secondary">Ưu tiên cao</Badge>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Hết hạn thanh toán</p>
                      <p className="text-sm text-gray-600">5 hóa đơn quá hạn cần xử lý</p>
                      <Badge variant="destructive">Khẩn cấp</Badge>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <Activity className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Báo cáo tháng</p>
                      <p className="text-sm text-gray-600">Báo cáo doanh thu tháng 6 đã sẵn sàng</p>
                      <Badge variant="secondary">Mới</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </StaffLayout>
    );
  } return (
    <StaffLayout userInfo={userInfo}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          <p className="text-gray-600">
            Chào mừng trở lại, {userInfo.name}
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