import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { DentistScheduleViewer } from '../../components/appointment/DentistScheduleViewer';
import { useUserInfo } from '@/hooks/useUserInfo';
export const StaffSchedulePage = () => {
  const userInfo = useUserInfo();

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
              Đăng nhập với vai trò: {userInfo.role}
            </div>
          </div>

          <DentistScheduleViewer mode="view" />
        </div>
      </StaffLayout>
    </AuthGuard>
  );
};