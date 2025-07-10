import React from 'react';
import { SupplyList } from '@/components/supply/SupplyList';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const InventoryPage: React.FC = () => {
  const userInfo = useUserInfo();


  return (
    <AuthGuard requiredRoles={['Administrator', 'Owner', 'Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <SupplyList />
      </StaffLayout>
    </AuthGuard>);
};