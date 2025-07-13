import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientImageGallery } from '@/components/patient/PatientImageGallery';
import { useUserInfo } from '@/hooks/useUserInfo';

export const TreatmentRecordImagesPage: React.FC = () => {
  const { patientId, recordId } = useParams<{ patientId: string; recordId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const isEditable = userInfo?.role === 'Assistant' || userInfo?.role === 'Dentist';

  const handleGoBack = () => {
    if (userInfo?.role === 'Patient') {
      navigate('/patient/treatment-records');
    } else {
      navigate(`/patients/${patientId}/treatment-records`);
    }
  };

  if (!patientId || !recordId) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="text-center">
          <p className="text-red-600">Thiếu thông tin bệnh nhân hoặc hồ sơ điều trị</p>
          <Button variant="outline" onClick={handleGoBack} className="mt-2">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          title="Quay lại danh sách hồ sơ điều trị"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hình Ảnh Hồ Sơ Điều Trị
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý hình ảnh cho hồ sơ điều trị #{recordId}
          </p>
        </div>
      </div>

      {/* Patient Images Gallery */}
      <PatientImageGallery
        patientId={parseInt(patientId)}
        treatmentRecordId={parseInt(recordId)}
        title={`Hình Ảnh Hồ Sơ Điều Trị #${recordId}`}
        readonly={!isEditable}
      />
    </div>
  );
};