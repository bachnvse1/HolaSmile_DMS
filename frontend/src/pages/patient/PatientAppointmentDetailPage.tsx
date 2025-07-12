import React from 'react';
import { useParams } from 'react-router';
import { AppointmentDetailView } from '../../components/appointment/AppointmentDetailView';
import { AuthGuard } from '../../components/AuthGuard';
import { PatientLayout } from '@/layouts/patient';
import { useUserInfo } from '@/hooks/useUserInfo';

export const PatientAppointmentDetailPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout userInfo={userInfo}>
            <AppointmentDetailView
              appointmentId={parseInt(appointmentId || '0')}
            />
      </PatientLayout>
    </AuthGuard>
  );
};