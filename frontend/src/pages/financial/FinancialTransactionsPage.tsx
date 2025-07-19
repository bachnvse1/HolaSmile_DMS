import React from 'react';
import { StaffLayout } from '../../layouts/staff/StaffLayout';
import { FinancialTransactionList } from '@/components/financial/FinancialTransactionList';
import { useUserInfo } from '@/hooks/useUserInfo';

export const FinancialTransactionsPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <StaffLayout userInfo={userInfo}>
      <FinancialTransactionList />
    </StaffLayout>
  );
};