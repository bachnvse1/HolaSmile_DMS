import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientImageGallery } from '@/components/patient/PatientImageGallery';
import { useUserInfo } from '@/hooks/useUserInfo';
import { TokenUtils } from '@/utils/tokenUtils';
import { AuthGuard } from '@/components/AuthGuard';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
export const OrthodonticTreatmentPlanImagesPage: React.FC = () => {
  const { patientId: paramPatientId, planId } = useParams<{ patientId: string; planId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const isEditable = userInfo?.role === 'Assistant' || userInfo?.role === 'Dentist'

  // Handle patient ID for different roles
  let patientId: string | undefined = paramPatientId;
  if (userInfo?.role === 'Patient') {
    const roleTableId = userInfo.roleTableId ?? TokenUtils.getRoleTableIdFromToken(localStorage.getItem('token') || '');
    patientId = roleTableId === null ? undefined : roleTableId;
  }

  const handleGoBack = () => {
    if (userInfo?.role === 'Patient') {
      navigate('/patient/orthodontic-treatment-plans');
    } else {
      navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
    }
  };

  if (!patientId || !planId) {
    return (
      <AuthGuard requiredRoles={['Dentist', 'Assistant']}>
        <StaffLayout userInfo={userInfo}>
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="text-center">
              <p className="text-red-600">Thiếu thông tin bệnh nhân hoặc kế hoạch điều trị</p>
              <Button variant="outline" onClick={handleGoBack} className="mt-2">
                Quay lại
              </Button>
            </div>
          </div>
        </StaffLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['Dentist', 'Assistant']}>
      <StaffLayout userInfo={userInfo}>
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              title="Quay lại danh sách kế hoạch điều trị"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hình Ảnh Kế Hoạch Điều Trị Chỉnh Nha
              </h1>
              <p className="text-gray-600 mt-1">
                Quản lý hình ảnh cho kế hoạch điều trị #{planId}
              </p>
            </div>
          </div>

          {/* Patient Images Gallery */}
          <PatientImageGallery
            patientId={parseInt(patientId)}
            orthodonticTreatmentPlanId={parseInt(planId)}
            title={`Hình Ảnh Kế Hoạch Điều Trị #${planId}`}
            readonly={!isEditable}
          />
        </div>
      </StaffLayout>
    </AuthGuard>
  );
};