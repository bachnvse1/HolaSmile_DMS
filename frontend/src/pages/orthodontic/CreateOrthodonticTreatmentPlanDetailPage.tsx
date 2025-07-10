import React from 'react';
import { OrthodonticTreatmentPlanDetailForm } from '@/components/orthodontic/OrthodonticTreatmentPlanDetailForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const CreateOrthodonticTreatmentPlanDetailPage: React.FC = () => {

  return (
    <AuthGuard requiredRoles={['Dentist']}>
      <StaffLayout userInfo={useUserInfo()}>
        <OrthodonticTreatmentPlanDetailForm />
      </StaffLayout>
    </AuthGuard>
  );
};