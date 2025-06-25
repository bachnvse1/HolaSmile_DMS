import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { AppointmentViewManager } from '../../components/appointment/AppointmentViewManager';
import { useAuth } from '../../hooks/useAuth';

export const StaffAppointmentsPage = () => {
  const { username, role, userId } = useAuth();

  // Create userInfo object for StaffLayout
  const userInfo = {
    id: userId || '',
    name: username || 'User',
    email: '', 
    role: role || '',
    avatar: undefined
  };

  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Quản lý lịch hẹn
            </h1>
            <p className="text-gray-600">
              Xem và quản lý tất cả lịch hẹn trong hệ thống. Bạn có thể xem dưới dạng danh sách hoặc lịch tuần.
            </p>
          </div>

          <AppointmentViewManager />
        </div>
      </StaffLayout>
    </AuthGuard>
  );
};