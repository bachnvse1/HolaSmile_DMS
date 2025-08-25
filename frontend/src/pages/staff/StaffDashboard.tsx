import { Users, Calendar, AlertCircle, Clock, CreditCard, DollarSign, Target } from 'lucide-react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { useUserInfo } from '@/hooks/useUserInfo';
import { useDashboardStats, useColumnChart, useLineChart, usePieChart } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
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
import { useMemo, memo, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

const RevenueChart = memo(({ data }: { data: Array<{ label: string, totalReceipt: number, totalPayment: number }> }) => {
  const transformedData = data.map(item => ({
    ...item,
    totalReceipt: item.totalReceipt / 1000000,
    totalPayment: item.totalPayment / 1000000
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={transformedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => {
            const formattedValue = typeof value === 'number' ? 
              `${value.toFixed(2)} triệu VNĐ` : 
              value;
            return [formattedValue, name];
          }}
        />
        <Legend />
        <Bar dataKey="totalReceipt" fill="#10b981" name="Thu nhập (triệu)" />
        <Bar dataKey="totalPayment" fill="#ef4444" name="Chi phí (triệu)" />
      </BarChart>
    </ResponsiveContainer>
  );
});
RevenueChart.displayName = 'RevenueChart';

const StatusPieChart = memo(({ data }: { data: Array<{ name: string, value: number, color: string }> }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
StatusPieChart.displayName = 'StatusPieChart';

const WeeklyLineChart = memo(({ data }: { data: Array<{ label: string, totalAppointments: number, revenueInMillions: number }> }) => {
  const transformedData = data.map(item => ({
    ...item,
    revenueInMillions: item.revenueInMillions / 1000000
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={transformedData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis yAxisId="left" orientation="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip
          formatter={(value, name) => {
            if (name === 'Doanh thu (triệu)') {
              return [
                typeof value === 'number' ? `${value.toFixed(2)} triệu VNĐ` : value,
                name
              ];
            }
            return [value, name];
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="totalAppointments"
          stroke="#8b5cf6"
          strokeWidth={3}
          dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
          name="Tổng lịch hẹn"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="revenueInMillions"
          stroke="#3b82f6"
          strokeWidth={3}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
          name="Doanh thu (triệu)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
WeeklyLineChart.displayName = 'WeeklyLineChart';

export const StaffDashboard = () => {
  const userInfo = useUserInfo();
  const [filter, setFilter] = useState('week');

  const { data: dashboardStats } = useDashboardStats(filter);
  const { data: columnData, isLoading: columnLoading } = useColumnChart(filter);
  const { data: lineData, isLoading: lineLoading } = useLineChart(filter);
  const { data: pieData, isLoading: pieLoading } = usePieChart(filter);

  const pieChartData = useMemo(() => {
    if (!pieData) return [];
    return [
      { name: 'Đã xác nhận', value: pieData.confirmed, color: '#3b82f6' },
      { name: 'Đã đến', value: pieData.attended, color: '#10b981' },
      { name: 'Vắng mặt', value: pieData.absented, color: '#f59e0b' },
      { name: 'Đã hủy', value: pieData.canceled, color: '#ef4444' },
    ].filter(item => item.value > 0);;
  }, [pieData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRoleSpecificStats = () => {
    switch (userInfo.role) {
      case 'Administrator':
      case 'Owner':
        return {
          title: 'Tổng Quan Hệ Thống',
          stats: [
            {
              label: filter === 'week' ? 'Tổng Doanh Thu Tuần' : filter === 'month' ? 'Tổng Doanh Thu Tháng' : 'Tổng Doanh Thu Năm',
              value: dashboardStats ? `${(dashboardStats.totalRevenue / 1000000).toFixed(2)} triệu VNĐ` : '0 triệu VNĐ',
              icon: DollarSign,
              color: 'blue',
            },
            {
              label: filter === 'week' ? 'Bệnh Nhân Khám Tuần' : filter === 'month' ? 'Bệnh Nhân Khám Tháng' : 'Bệnh Nhân Khám Năm',
              value: dashboardStats ? dashboardStats.newPatient.toString() : '0',
              icon: Target,
              color: 'orange',
            },
            {
              label: 'Lịch Hẹn',
              value: dashboardStats ? dashboardStats.totalAppointments.toString() : '0',
              icon: Calendar,
              color: 'purple',
            },
            {
              label: 'Tổng Bệnh Nhân',
              value: dashboardStats ? dashboardStats.totalPatient.toString() : '0',
              icon: Users,
              color: 'green',
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

  if (userInfo.role === 'Administrator' || userInfo.role === 'Owner') {
    return (
      <StaffLayout userInfo={userInfo}>
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Chào mừng trở lại, {userInfo.name}
                  </CardDescription>
                </div>
                
                {/* Filter Buttons */}
                <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                  <Button
                    variant={filter === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('week')}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Tuần
                  </Button>
                  <Button
                    variant={filter === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('month')}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Tháng
                  </Button>
                  <Button
                    variant={filter === 'year' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter('year')}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Năm
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              const getGradientClasses = (color: string) => {
                const gradientMap = {
                  blue: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200',
                  green: 'bg-gradient-to-br from-green-50 to-green-100 border-green-200',
                  purple: 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200',
                  orange: 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200',
                  red: 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
                };
                return gradientMap[color as keyof typeof gradientMap] || 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200';
              };

              const getIconBg = (color: string) => {
                const iconBgMap = {
                  blue: 'bg-blue-500',
                  green: 'bg-green-500',
                  purple: 'bg-purple-500',
                  orange: 'bg-orange-500',
                  red: 'bg-red-500'
                };
                return iconBgMap[color as keyof typeof iconBgMap] || 'bg-gray-500';
              };

              const getTextColor = (color: string) => {
                const textColorMap = {
                  blue: 'text-blue-700',
                  green: 'text-green-700',
                  purple: 'text-purple-700',
                  orange: 'text-orange-700',
                  red: 'text-red-700'
                };
                return textColorMap[color as keyof typeof textColorMap] || 'text-gray-700';
              };

              const getValueColor = (color: string) => {
                const valueColorMap = {
                  blue: 'text-blue-900',
                  green: 'text-green-900',
                  purple: 'text-purple-900',
                  orange: 'text-orange-900',
                  red: 'text-red-900'
                };
                return valueColorMap[color as keyof typeof valueColorMap] || 'text-gray-900';
              };

              return (
                <Card key={index} className={getGradientClasses(stat.color)}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className={`p-1.5 sm:p-2 ${getIconBg(stat.color)} rounded-lg flex-shrink-0`}>
                        <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-medium ${getTextColor(stat.color)} truncate`}>{stat.label}</p>
                        <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${getValueColor(stat.color)} mt-1`}>{stat.value}</p>
                      </div>
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
                <CardTitle>Thu Chi Tài Chính</CardTitle>
                <CardDescription>
                  Theo dõi thu nhập và chi phí theo {filter === 'week' ? 'tuần' : filter === 'month' ? 'tháng' : 'năm'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {columnLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <RevenueChart data={columnData?.data || []} />
                )}
              </CardContent>
            </Card>

            {/* Status Distribution Pie Chart */}
            <Card className="will-change-transform">
              <CardHeader>
                <CardTitle>Trạng Thái Lịch Hẹn</CardTitle>
                <CardDescription>
                  Phân bố trạng thái các lịch hẹn trong {filter === 'week' ? 'tuần' : filter === 'month' ? 'tháng' : 'năm'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <StatusPieChart data={pieChartData} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Appointments Line Chart */}
            <Card className="lg:col-span-2 will-change-transform">
              <CardHeader>
                <CardTitle>Lịch Hẹn & Doanh Thu Theo Thời Gian</CardTitle>
                <CardDescription>
                  Xu hướng lịch hẹn và doanh thu theo {filter === 'week' ? 'tuần' : filter === 'month' ? 'tháng' : 'năm'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lineLoading ? (
                  <div className="flex justify-center items-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <WeeklyLineChart data={lineData?.data || []} />
                )}
              </CardContent>
            </Card>

            {/* Progress Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Thống Kê Chi Tiết</CardTitle>
                <CardDescription>
                  Phân tích chi tiết các chỉ số
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tỷ lệ hoàn thành lịch hẹn */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tỷ lệ hoàn thành lịch hẹn</span>
                    <span>{pieData ? Math.round((pieData.attended / (pieData.confirmed + pieData.attended + pieData.absented + pieData.canceled || 1)) * 100) : 0}%</span>
                  </div>
                  <Progress value={pieData ? (pieData.attended / (pieData.confirmed + pieData.attended + pieData.absented + pieData.canceled || 1)) * 100 : 0} className="h-2" />
                </div>

                {/* Tỷ lệ vắng mặt */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Tỷ lệ vắng mặt</span>
                    <span>{pieData ? Math.round((pieData.absented / (pieData.confirmed + pieData.attended + pieData.absented + pieData.canceled || 1)) * 100) : 0}%</span>
                  </div>
                  <Progress value={pieData ? (pieData.absented / (pieData.confirmed + pieData.attended + pieData.absented + pieData.canceled || 1)) * 100 : 0} className="h-2 [&>*]:bg-red-500" />
                </div>

                {/* Trung bình lịch hẹn/tuần */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>TB lịch hẹn/ngày tuần này</span>
                    <span>{lineData ? Math.round(lineData.data.reduce((sum, day) => sum + day.totalAppointments, 0) / 7) : 0}</span>
                  </div>
                  <Progress value={lineData ? Math.min((lineData.data.reduce((sum, day) => sum + day.totalAppointments, 0) / 7) * 10, 100) : 0} className="h-2 [&>*]:bg-purple-500" />
                </div>

                {/* Doanh thu/lịch hẹn trung bình */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Doanh thu TB/lịch hẹn</span>
                    <span>{dashboardStats && dashboardStats.totalAppointments > 0 ? formatCurrency(dashboardStats.totalRevenue / dashboardStats.totalAppointments) : '0 VNĐ'}</span>
                  </div>
                  <Progress value={dashboardStats && dashboardStats.totalAppointments > 0 ? Math.min((dashboardStats.totalRevenue / dashboardStats.totalAppointments) / 50000, 100) : 0} className="h-2 [&>*]:bg-green-500" />
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
                  Các sự kiện mới nhất trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <DollarSign className="h-5 w-5 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Thanh toán mới</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.newInvoice?.data || 'Không có thanh toán mới'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.newInvoice?.time || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <Users className="h-5 w-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Bệnh nhân mới đăng ký</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.newPatientAppointment?.data || 'Không có bệnh nhân mới'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.newPatientAppointment?.time || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Lịch hẹn mới</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.newAppointment?.data || 'Không có lịch hẹn mới'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.newAppointment?.time || ''}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cảnh Báo & Thông Báo</CardTitle>
                <CardDescription>
                  Các vấn đề cần chú ý và xử lý
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Hóa đơn chưa thanh toán</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.unpaidInvoice?.data || 'Không có hóa đơn chưa thanh toán'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.unpaidInvoice?.time || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Giao dịch chưa duyệt</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.unapprovedTransaction?.data || 'Không có giao dịch chưa duyệt'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.unapprovedTransaction?.time || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Thiết bị chưa bảo trì</p>
                      <p className="text-sm text-gray-600">{dashboardStats?.underMaintenance?.data || 'Không có thiết bị chưa bảo trì'}</p>
                      <p className="text-xs text-gray-500">{dashboardStats?.underMaintenance?.time || ''}</p>
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
    <AuthGuard requiredRoles={['Owner']}>
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
    </AuthGuard>
  );
};