import React from 'react';
import { OrthodonticTreatmentPlanDetailForm } from '@/components/orthodontic/OrthodonticTreatmentPlanDetailForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { PatientLayout } from '@/layouts/patient';
export const PatientOrthodonticDetailPage: React.FC = () => {

  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout userInfo={useUserInfo()}>
        <OrthodonticTreatmentPlanDetailForm mode="view" />
      </PatientLayout>
    </AuthGuard>
  );
};