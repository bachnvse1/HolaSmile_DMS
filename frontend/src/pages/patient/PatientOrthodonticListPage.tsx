import React from 'react';
import { OrthodonticTreatmentPlanList } from '@/components/orthodontic/OrthodonticTreatmentPlanList';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { PatientLayout } from '@/layouts/patient';
export const PatientOrthodonticListPage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout userInfo={useUserInfo()}>
        <OrthodonticTreatmentPlanList />
      </PatientLayout>
    </AuthGuard>);
};