import React from 'react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { PromotionList } from '@/components/promotion/PromotionList';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';

export const PromotionManagementPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Receptionist']}>
      <StaffLayout userInfo={userInfo}>
        <PromotionList />
      </StaffLayout>
    </AuthGuard>
  );
};