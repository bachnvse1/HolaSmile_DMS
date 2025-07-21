import React from 'react';
import { PrescriptionTemplateDetail } from '@/components/prescription/PrescriptionTemplateDetail';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const PrescriptionTemplateDetailPage: React.FC = () => {
  return (
    <AuthGuard requiredRoles={['Assistant', 'Dentist']}>
      <StaffLayout userInfo={useUserInfo()}>
        <PrescriptionTemplateDetail />
      </StaffLayout>
    </AuthGuard >);
};