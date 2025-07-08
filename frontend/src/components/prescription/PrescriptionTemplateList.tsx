import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePrescriptionTemplates, useDeactivatePrescriptionTemplate } from '@/hooks/usePrescriptionTemplates';
import type { PrescriptionTemplate } from '@/types/prescriptionTemplate';

export const PrescriptionTemplateList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  
  const { data: templates = [], isLoading, error, refetch } = usePrescriptionTemplates(searchQuery);
  const { mutate: deactivateTemplate, isPending: isDeactivating } = useDeactivatePrescriptionTemplate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleView = (template: PrescriptionTemplate) => {
    navigate(`/prescription-templates/${template.PreTemplateID}`);
  };

  const handleEdit = (template: PrescriptionTemplate) => {
    navigate(`/prescription-templates/${template.PreTemplateID}/edit`);
  };

  const handleDeactivate = async (template: PrescriptionTemplate) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu đơn "${template.PreTemplateName}"?`)) {
      deactivateTemplate(template.PreTemplateID, {
        onSuccess: () => {
          toast.success('Đã xóa mẫu đơn thuốc thành công');
          refetch();
        },
        onError: () => {
          toast.error('Có lỗi xảy ra khi xóa mẫu đơn thuốc');
        }
      });
    }
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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu: {error.message}</p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản Lý Mẫu Đơn Thuốc</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Tổng cộng {templates.length} mẫu đơn thuốc
          </p>
        </div>
        <Button 
          onClick={() => navigate('/prescription-templates/create')}
          className="w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo Mẫu Đơn Mới
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm theo tên mẫu đơn..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy mẫu đơn thuốc' : 'Chưa có mẫu đơn thuốc nào'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {searchQuery 
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Bắt đầu tạo mẫu đơn thuốc đầu tiên'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/prescription-templates/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Mẫu Đơn Mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {templates.map((template) => (
            <Card key={template.PreTemplateID} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                  {template.PreTemplateName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Preview */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {template.PreTemplateContext}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Cập nhật: {formatDate(template.UpdatedAt)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-1 sm:space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(template)}
                        className="p-1 sm:p-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(template)}
                        className="p-1 sm:p-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeactivate(template)}
                      disabled={isDeactivating}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};