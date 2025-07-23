import React from 'react';
import { SupplyDetail } from '@/components/supply/SupplyDetail';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const SupplyDetailPage: React.FC = () => {
  const userInfo = useUserInfo();
  return (
    <AuthGuard requiredRoles={['Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <SupplyDetail />
      </StaffLayout>
    </AuthGuard>
  );
};