import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientImageGallery } from '@/components/patient/PatientImageGallery';
import { useUserInfo } from '@/hooks/useUserInfo';
import { AuthGuard } from '@/components/AuthGuard';
import { PatientLayout } from '@/layouts/patient';

export const PatientTreatmentImagesPage: React.FC = () => {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const isEditable = userInfo?.role === 'Assistant' || userInfo?.role === 'Dentist';

  console.log('🔍 PatientTreatmentImagesPage params:', { recordId });

  const handleGoBack = () => {
    if (userInfo?.role === 'Patient') {
      navigate('/patient/treatment-records');
    } else {
      navigate('/patient/view-treatment-records');
    }
  };

  if (!recordId) {
    return (
      <AuthGuard requiredRoles={['Patient']}>
        <PatientLayout userInfo={userInfo}>
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="text-center">
              <p className="text-red-600">Thiếu thông tin hồ sơ điều trị</p>
              <Button variant="outline" onClick={handleGoBack} className="mt-2">
                Quay lại
              </Button>
            </div>
          </div>
        </PatientLayout>
      </AuthGuard >
    );
  }

  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout userInfo={userInfo}>
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              title="Quay lại danh sách hồ sơ điều trị"
              className='border border-gray-300'
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hình Ảnh Hồ Sơ Điều Trị
              </h1>
              <p className="text-gray-600 mt-1">
                Hình ảnh cho hồ sơ điều trị #{recordId}
              </p>
            </div>
          </div>

          {/* Patient Images Gallery */}
          <PatientImageGallery
            patientId={0} // Will be overridden by roleTableId for Patient role
            treatmentRecordId={parseInt(recordId)}
            title={`Hình Ảnh Hồ Sơ Điều Trị #${recordId}`}
            readonly={!isEditable}
          />
        </div>
      </PatientLayout>
    </AuthGuard>
  );
};