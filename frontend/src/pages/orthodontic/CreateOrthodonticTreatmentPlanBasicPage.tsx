import React from 'react';
import { OrthodonticTreatmentPlanBasicForm } from '@/components/orthodontic/OrthodonticTreatmentPlanBasicForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const CreateOrthodonticTreatmentPlanBasicPage: React.FC = () => {
  const userInfo = useUserInfo();
  return (
    <AuthGuard requiredRoles={['Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <OrthodonticTreatmentPlanBasicForm />
      </StaffLayout>
    </AuthGuard>);
};