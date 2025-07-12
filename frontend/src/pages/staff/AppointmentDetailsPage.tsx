import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { AppointmentDetailView } from '../../components/appointment/AppointmentDetailView';
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '@/layouts/staff';
import { useUserInfo } from '@/hooks/useUserInfo';

export const AppointmentDetailsPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const handleGoBack = () => {
    navigate(-1); // Go back to previous page
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">ID lịch hẹn không hợp lệ</p>
          <Button onClick={handleGoBack}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
            <AppointmentDetailView
              appointmentId={parseInt(appointmentId)}
            />
      </StaffLayout>
    </AuthGuard>
  );
};