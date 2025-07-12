import React from 'react';
import { PrescriptionTemplateList } from '@/components/prescription/PrescriptionTemplateList';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
import { useUserInfo } from '@/hooks/useUserInfo';
export const PrescriptionTemplatesPage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Assistant', 'Dentist']}>
      <StaffLayout userInfo={useUserInfo()}>
        <PrescriptionTemplateList />
      </StaffLayout>
    </AuthGuard>
  );
};