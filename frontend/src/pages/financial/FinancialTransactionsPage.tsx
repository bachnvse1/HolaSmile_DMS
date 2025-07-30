import React from 'react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { FinancialManagement } from '@/components/financial/FinancialManagement';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
export const FinancialTransactionsPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Owner', 'Receptionist']}>
    <StaffLayout userInfo={userInfo}>
      <FinancialManagement />
    </StaffLayout>
    </AuthGuard>
  );
};