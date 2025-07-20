import React from 'react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { FinancialTransactionList } from '@/components/financial/FinancialTransactionList';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
export const FinancialTransactionsPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Owner', 'Receptionist']}>
    <StaffLayout userInfo={userInfo}>
      <FinancialTransactionList />
    </StaffLayout>
    </AuthGuard>
  );
};