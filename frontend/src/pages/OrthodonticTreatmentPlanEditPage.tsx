import React from 'react';
import { PatientLayout } from '@/layouts/patient/PatientLayout';
import { OrthodonticTreatmentPlanBasicForm } from '@/components/orthodontic/OrthodonticTreatmentPlanBasicForm';

export const OrthodonticTreatmentPlanEditPage: React.FC = () => {
  return (
    <PatientLayout>
      <OrthodonticTreatmentPlanBasicForm mode="edit" />
    </PatientLayout>
  );
};