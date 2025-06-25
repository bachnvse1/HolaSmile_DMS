import { AuthGuard } from '../../components/AuthGuard';
import { PatientLayout } from '../../layouts/patient/PatientLayout';
import { AppointmentViewManager } from '../../components/appointment/AppointmentViewManager';

export const PatientAppointmentsPage = () => {
  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout>
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Lịch hẹn của tôi
            </h1>
            <p className="text-gray-600">
              Xem và theo dõi các lịch hẹn khám của bạn. Bạn có thể xem dưới dạng danh sách hoặc lịch tuần.
            </p>
          </div>

          <AppointmentViewManager />
        </div>
      </PatientLayout>
    </AuthGuard>
  );
};