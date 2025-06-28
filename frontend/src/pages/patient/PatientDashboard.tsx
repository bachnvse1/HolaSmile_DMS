import { useAuth } from '../../hooks/useAuth';
import { Calendar, Clock, FileText, User } from 'lucide-react';

export const PatientDashboard = () => {
  const { fullName, userId, role } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại, {fullName}!
        </h1>
        <p className="text-gray-600">
          Quản lý lịch hẹn và theo dõi quá trình điều trị của bạn
        </p>
        <p className="text-sm text-gray-500 mt-2">
          ID: {userId} | Role: {role}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Lịch Hẹn</h3>
              <p className="text-sm text-gray-600">Sắp tới</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">2</p>
            <p className="text-sm text-gray-600">Lịch hẹn trong tuần</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Hồ Sơ</h3>
              <p className="text-sm text-gray-600">Y tế</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-sm text-gray-600">Lần khám</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Điều Trị</h3>
              <p className="text-sm text-gray-600">Đang thực hiện</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-bold text-gray-900">1</p>
            <p className="text-sm text-gray-600">Kế hoạch điều trị</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Bác Sĩ</h3>
              <p className="text-sm text-gray-600">Phụ trách</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg font-bold text-gray-900">BS. Nguyễn Văn B</p>
            <p className="text-sm text-gray-600">Nha khoa tổng quát</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch Hẹn Sắp Tới</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Khám định kỳ</p>
                <p className="text-sm text-gray-600">15/01/2025 - 14:00</p>
                <p className="text-sm text-gray-600">BS. Nguyễn Văn B</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Điều trị răng sâu</p>
                <p className="text-sm text-gray-600">20/01/2025 - 09:30</p>
                <p className="text-sm text-gray-600">BS. Trần Thị C</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lịch Sử Điều Trị</h2>
          <div className="space-y-4">
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Tẩy trắng răng</p>
                <p className="text-sm text-gray-600">Hoàn thành - 10/01/2025</p>
                <p className="text-sm text-gray-600">BS. Nguyễn Văn B</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-gray-50 rounded-lg">
              <FileText className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Cạo vôi răng</p>
                <p className="text-sm text-gray-600">Hoàn thành - 05/01/2025</p>
                <p className="text-sm text-gray-600">BS. Trần Thị C</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};