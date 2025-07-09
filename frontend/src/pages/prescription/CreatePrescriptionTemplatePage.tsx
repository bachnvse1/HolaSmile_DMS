import React from 'react';
import { PrescriptionTemplateForm } from '@/components/prescription/PrescriptionTemplateForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const CreatePrescriptionTemplatePage: React.FC = () => {
  const userInfo = useUserInfo();
  return (
    <AuthGuard requiredRoles={['Assistant']}>
      <StaffLayout userInfo={userInfo}>
        <PrescriptionTemplateForm />
      </StaffLayout>
    </AuthGuard>);
};