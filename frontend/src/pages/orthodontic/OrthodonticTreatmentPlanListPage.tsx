import React from 'react';
import { OrthodonticTreatmentPlanList } from '@/components/orthodontic/OrthodonticTreatmentPlanList';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const OrthodonticTreatmentPlanListPage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Dentist', 'Assistant']}>
      <StaffLayout userInfo={useUserInfo()}>
        <OrthodonticTreatmentPlanList />
      </StaffLayout>
    </AuthGuard>);
};