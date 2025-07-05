import React from 'react';
import { SupplyForm } from '@/components/supply/SupplyForm';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
export const CreateSupplyPage: React.FC = () => {
  const userInfo = useUserInfo();

  return (
    <AuthGuard requiredRoles={['Assistant']}>
      <SupplyForm mode="create" />
    </AuthGuard >);
};