import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit, Trash2, FileText, User, Calendar, DollarSign, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrthodonticTreatmentPlan, useDeleteOrthodonticTreatmentPlan } from '@/hooks/useMockOrthodonticTreatmentPlan';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateWithDay } from '@/utils/dateUtils';

export const OrthodonticTreatmentPlanDetail: React.FC = () => {
  const { patientId, planId } = useParams<{ patientId: string; planId: string }>();
  const navigate = useNavigate();
  
  const { data: treatmentPlan, isLoading, error } = useOrthodonticTreatmentPlan(
    parseInt(planId || '0')
  );
  const deleteMutation = useDeleteOrthodonticTreatmentPlan();

  const handleGoBack = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
  };

  const handleEdit = () => {
    navigate(`/patients/${patientId}/orthodontic-treatment-plans/${planId}/edit`);
  };

  const handleDelete = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa kế hoạch điều trị này?')) {
      try {
        await deleteMutation.mutateAsync(parseInt(planId || '0'));
        navigate(`/patients/${patientId}/orthodontic-treatment-plans`);
      } catch (error) {
        console.error('Error deleting treatment plan:', error);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error || !treatmentPlan) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Không tìm thấy kế hoạch điều trị</p>
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            className="mt-2"
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi Tiết Kế Hoạch Điều Trị</h1>
            <p className="text-gray-600 mt-1">Xem thông tin chi tiết kế hoạch điều trị nha khoa</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            In
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Chỉnh Sửa
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Thông Tin Cơ Bản
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tên Kế Hoạch</p>
              <p className="text-base font-semibold">{treatmentPlan.planTitle}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Template</p>
              <Badge variant="secondary">{treatmentPlan.templateName}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Ngày Tạo</p>
              <p className="text-base">{formatDateWithDay(treatmentPlan.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Cập Nhật Lần Cuối</p>
              <p className="text-base">{formatDateWithDay(treatmentPlan.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient History */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Tiểu Sử Bệnh Nhân
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Tiểu Sử Bệnh</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.treatmentHistory}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Lý Do Đến Khám</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.reasonForVisit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Examination */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Khám Lâm Sàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Kết Quả Khám Lâm Sàng</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.examinationFindings}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Khám Trong Miệng</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.intraoralExam}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Phân Tích Chẩn Đoán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Phân Tích X-quang</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.xRayAnalysis}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Phân Tích Mẫu Hàm</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.modelAnalysis}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treatment Plan Content */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kế Hoạch Điều Trị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{treatmentPlan.treatmentPlanContent}</p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Chi Phí & Thanh Toán
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tổng Chi Phí</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(treatmentPlan.totalCost)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Phương Thức Thanh Toán</p>
              <Badge variant="outline" className="text-base px-3 py-1">
                {treatmentPlan.paymentMethod}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};