import React from 'react';
import { PrescriptionTemplateEditForm } from '@/components/prescription/PrescriptionTemplateEditForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const EditPrescriptionTemplatePage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Assistant', 'Dentist']}>
      <StaffLayout userInfo={useUserInfo()}>
        <PrescriptionTemplateEditForm />
      </StaffLayout>
    </AuthGuard>
  );
};