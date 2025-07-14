import React from 'react';
import { OrthodonticTreatmentPlanBasicForm } from '@/components/orthodontic/OrthodonticTreatmentPlanBasicForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const OrthodonticTreatmentPlanEditPage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Dentist']}>
      <StaffLayout userInfo={useUserInfo()}>
        <OrthodonticTreatmentPlanBasicForm mode="edit" />
      </StaffLayout>
    </AuthGuard>
  );
};