import React from 'react';
import { PatientLayout } from '@/layouts/patient/PatientLayout';
import { OrthodonticTreatmentPlanDetailForm } from '@/components/orthodontic/OrthodonticTreatmentPlanDetailForm';

export const OrthodonticTreatmentPlanEditDetailPage: React.FC = () => {
  return (
    <PatientLayout>
      <OrthodonticTreatmentPlanDetailForm mode="edit" />
    </PatientLayout>
  );
};