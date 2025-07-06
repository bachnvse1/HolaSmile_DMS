import React from 'react';
import { SupplyForm } from '@/components/supply/SupplyForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const CreateSupplyPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Assistant']}>
      <StaffLayout userInfo={userInfo}>
        <SupplyForm mode="create" />
      </StaffLayout>
    </AuthGuard >);
};