import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { AppointmentDetailView } from '../components/appointment/AppointmentDetailView';

export const AppointmentDetailsPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!appointmentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">ID lịch hẹn không hợp lệ</p>
          <Button onClick={handleGoBack}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                Chi tiết lịch hẹn
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Centered with modal-like width */}
      <div className="flex justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AppointmentDetailView
            appointmentId={parseInt(appointmentId)}
          />
        </div>
      </div>
    </div>
  );
};