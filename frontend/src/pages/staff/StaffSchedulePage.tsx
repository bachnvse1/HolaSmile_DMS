import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { DentistScheduleViewer } from '../../components/appointment/DentistScheduleViewer';
import { useAuth } from '../../hooks/useAuth';

export const StaffSchedulePage = () => {
  const { fullName, role, userId } = useAuth();

  // Create userInfo object for StaffLayout
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '', 
    role: role || '',
    avatar: undefined
  };

  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lịch Làm Việc Bác Sĩ
            </h1>
            <p className="text-gray-600">
              Xem lịch làm việc của tất cả bác sĩ trong phòng khám
            </p>
            <div className="mt-2 text-sm text-blue-600">
              Đăng nhập với vai trò: {role}
            </div>
          </div>

          <DentistScheduleViewer mode="view" />
        </div>
      </StaffLayout>
    </AuthGuard>
  );
};