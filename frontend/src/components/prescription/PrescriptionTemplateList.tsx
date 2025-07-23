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
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import { usePrescriptionTemplates, useDeactivatePrescriptionTemplate } from '@/hooks/usePrescriptionTemplates';
import { formatDate } from '@/utils/dateUtils';
import { useUserInfo } from '@/hooks/useUserInfo';
import type { PrescriptionTemplate } from '@/types/prescriptionTemplate';
import { getErrorMessage } from '@/utils/formatUtils';

export const PrescriptionTemplateList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    template: PrescriptionTemplate | null;
  }>({
    isOpen: false,
    template: null
  });
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const userRole = userInfo?.role || '';
  const canEdit = userRole === 'Assistant' || userRole === 'Dentist';

  // Fetch all templates without search filter
  const { data: allTemplates = [], isLoading, error } = usePrescriptionTemplates();
  const { mutate: deactivateTemplate, isPending: isDeactivating } = useDeactivatePrescriptionTemplate();

  // Client-side search filtering
  const templates = React.useMemo(() => {
    if (!searchQuery) return allTemplates;

    return allTemplates.filter(template =>
      template.PreTemplateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.PreTemplateContext.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTemplates, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Pagination logic
  const totalItems = templates.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTemplates = templates.slice(startIndex, endIndex);

  const handleView = (template: PrescriptionTemplate) => {
    navigate(`/prescription-templates/${template.PreTemplateID}`);
  };

  const handleEdit = (template: PrescriptionTemplate) => {
    navigate(`/prescription-templates/${template.PreTemplateID}/edit`);
  };

  const handleDeactivate = (template: PrescriptionTemplate) => {
    setConfirmModal({
      isOpen: true,
      template: template
    });
  };

  const handleConfirmDelete = () => {
    const template = confirmModal.template;
    if (!template) return;

    deactivateTemplate(template.PreTemplateID, {
      onSuccess: () => {
        toast.success('Đã xóa mẫu đơn thuốc thành công');
        setConfirmModal({ isOpen: false, template: null });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xóa mẫu đơn thuốc');
        setConfirmModal({ isOpen: false, template: null });
      }
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

  // Only show error for non-empty data errors
  if (error) {
    const apiError = error as { 
      response?: { status?: number; data?: { message?: string } }; 
      message?: string;
    };
    
    // Check for various empty data error patterns
    const isEmptyDataError = 
      (apiError?.response?.status === 200 && 
       apiError?.response?.data?.message === "Không có dữ liệu phù hợp") ||
      (apiError?.message?.includes('is not a function')) ||
      (apiError?.message?.includes('Cannot read property')) ||
      (apiError?.message?.includes('map is not a function'));
    
    if (!isEmptyDataError) {
      return (
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu: {(error as Error).message}</p>
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
        {canEdit && (
          <Button
            onClick={() => navigate('/prescription-templates/create')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo Mẫu Đơn Mới
          </Button>
        )}
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
              {searchQuery ? 'Không tìm thấy mẫu đơn thuốc' : 'Không có mẫu đơn thuốc'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              {searchQuery
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Bắt đầu tạo mẫu đơn thuốc đầu tiên để sử dụng trong điều trị'
              }
            </p>
            {!searchQuery && canEdit && (
              <Button onClick={() => navigate('/prescription-templates/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Mẫu Đơn Mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedTemplates.map((template) => (
            <Card key={template.PreTemplateID} className="hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
                  {template.PreTemplateName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col flex-1">
                <div className="space-y-3 flex-1">
                  {/* Preview - always 3 lines */}
                  <div className="bg-gray-50 rounded-lg p-3 flex-1">
                    <p className="text-sm text-gray-600 line-clamp-2 min-h-[4rem] leading-relaxed">
                      {template.PreTemplateContext}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">Cập nhật: {formatDate(new Date(template.UpdatedAt), 'dd/MM/yyyy HH:mm:ss')}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex space-x-1 sm:space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(template)}
                        className="p-1 sm:p-2"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                          className="p-1 sm:p-2"
                          title="Chỉnh sửa"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeactivate(template)}
                        disabled={isDeactivating}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {templates.length > 0 && (
        <div className="mt-6 bg-white px-4 py-3 sm:px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="justify-center"
          />
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, template: null })}
        onConfirm={handleConfirmDelete}
        title="Xóa mẫu đơn thuốc"
        message={
          confirmModal.template
            ? `Bạn có chắc chắn muốn xóa mẫu đơn "${confirmModal.template.PreTemplateName}"?`
            : ''
        }
        confirmText="Xóa"
        confirmVariant="destructive"
        isLoading={isDeactivating}
      />
    </div>
  );
};