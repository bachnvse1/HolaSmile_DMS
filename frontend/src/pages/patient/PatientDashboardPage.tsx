import { useAuth } from '../../hooks/useAuth';
import { AuthGuard } from '../../components/AuthGuard';
import { PatientLayout } from '../../layouts/patient/PatientLayout';

// Example usage of the new auth system
export const PatientDashboardPage = () => {
  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout>
        <PatientDashboardContent />
      </PatientLayout>
    </AuthGuard>
  );
};

const PatientDashboardContent = () => {
  const { fullName } = useAuth();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại, {fullName}!
        </h1>
      </div>
      
      {/* Dashboard content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Lịch Hẹn</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">2</p>
          <p className="text-sm text-gray-500">Sắp tới</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Hồ Sơ Y Tế</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">5</p>
          <p className="text-sm text-gray-500">Lần khám</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Điều Trị</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">1</p>
          <p className="text-sm text-gray-500">Đang thực hiện</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900">Thanh Toán</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">3</p>
          <p className="text-sm text-gray-500">Chờ thanh toán</p>
        </div>
      </div>
    </div>
  );
};