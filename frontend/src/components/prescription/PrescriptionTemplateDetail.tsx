import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, Trash2, Calendar, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrescriptionTemplate, useDeactivatePrescriptionTemplate } from '@/hooks/usePrescriptionTemplates';

export const PrescriptionTemplateDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const templateId = id ? parseInt(id) : 0;
  const { data: template, isLoading } = usePrescriptionTemplate(templateId);
  const { mutate: deactivateTemplate, isPending: isDeactivating } = useDeactivatePrescriptionTemplate();

  const handleEdit = () => {
    navigate(`/prescription-templates/${templateId}/edit`);
  };

  const handleDeactivate = async () => {
    if (!template) return;
    
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu đơn "${template.PreTemplateName}"?`)) {
      deactivateTemplate(template.PreTemplateID, {
        onSuccess: () => {
          toast.success('Đã xóa mẫu đơn thuốc thành công');
          navigate('/prescription-templates');
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi xóa mẫu đơn thuốc');
        }
      });
    }
  };

  const handleGoBack = () => {
    navigate('/prescription-templates');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không tìm thấy mẫu đơn thuốc</p>
            <Button variant="outline" onClick={handleGoBack} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chi Tiết Mẫu Đơn Thuốc</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Xem thông tin chi tiết mẫu đơn thuốc</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-none">
            <Edit className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Chỉnh Sửa</span>
            <span className="sm:hidden">Sửa</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDeactivate}
            disabled={isDeactivating}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">{isDeactivating ? 'Đang xóa...' : 'Xóa'}</span>
            <span className="sm:hidden">{isDeactivating ? '...' : 'Xóa'}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Thông Tin Cơ Bản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Tên Mẫu Đơn</label>
                <p className="text-lg font-semibold text-gray-900 mt-1">
                  {template.PreTemplateName}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Tạo lúc: {formatDate(template.CreatedAt)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Cập nhật: {formatDate(template.UpdatedAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Template Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Nội Dung Mẫu Đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">
                {template.PreTemplateContext}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Hướng Dẫn Sử Dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <User className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Mẫu đơn này có thể được sử dụng trong các ca điều trị tương tự</span>
              </div>
              <div className="flex items-start">
                <Edit className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Bác sĩ có thể chỉnh sửa nội dung khi sử dụng cho từng bệnh nhân cụ thể</span>
              </div>
              <div className="flex items-start">
                <Calendar className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Nên xem xét cập nhật mẫu đơn định kỳ theo các hướng dẫn điều trị mới</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};