import React from 'react';
import { SupplyForm } from '@/components/supply/SupplyForm';
import { useParams } from 'react-router';

export const EditSupplyPage: React.FC = () => {
  const { supplyId } = useParams();
  return <SupplyForm mode="edit"
    supplyId={Number(supplyId)} />;
};