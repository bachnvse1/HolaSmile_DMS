import React, { useState } from 'react';
import { Plus, Search, Calendar, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { usePromotionPrograms, useDeactivatePromotionProgram } from '@/hooks/usePromotions';
import { formatDateShort, getDaysRemaining } from '@/utils/date';
import { getErrorMessage } from '@/utils/formatUtils';
import type { PromotionProgram } from '@/types/promotion.types';
import { CreatePromotionModal } from './CreatePromotionModal';
import { EditPromotionModal } from './EditPromotionModal';
import { useUserInfo } from '@/hooks/useUserInfo';

export const PromotionList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const navigate = useNavigate();

  const userInfo = useUserInfo();
  const canEdit = userInfo?.role === 'Receptionist';

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<{ isOpen: boolean; programId: number | null }>({
    isOpen: false,
    programId: null
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    program: PromotionProgram | null;
  }>({
    isOpen: false,
    program: null
  });

  const { data: programs = [], isLoading, error } = usePromotionPrograms();
  const { mutate: deactivateProgram, isPending: isDeactivating } = useDeactivatePromotionProgram();

  // Filter and search programs
  const filteredPrograms = React.useMemo(() => {
    let filtered = programs;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(program =>
        filter === 'active' ? !program.isDelete : program.isDelete
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(program =>
        program.discountProgramName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [programs, filter, searchQuery]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalPrograms = programs.length;
    const activePrograms = programs.filter(p => !p.isDelete).length;
    const inactivePrograms = programs.filter(p => p.isDelete).length;
    const expiringSoon = programs.filter(p => {
      const daysRemaining = getDaysRemaining(p.endDate);
      return !p.isDelete && daysRemaining <= 7 && daysRemaining > 0;
    }).length;

    return {
      totalPrograms,
      activePrograms,
      inactivePrograms,
      expiringSoon
    };
  }, [programs]);

  // Pagination logic
  const totalItems = filteredPrograms.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: 'all' | 'active' | 'inactive') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleView = (programId: number) => {
    navigate(`/promotions/${programId}`);
  };

  const handleEdit = (programId: number) => {
    setShowEditModal({ isOpen: true, programId });
  };

  const handleDeactivate = (program: PromotionProgram) => {
    setConfirmModal({
      isOpen: true,
      program: program
    });
  };

  const handleConfirmDeactivate = () => {
    const program = confirmModal.program;
    if (!program) return;

    deactivateProgram(program.discountProgramID, {
      onSuccess: () => {
        toast.success(`Đã ${program.isDelete ? 'kích hoạt' : 'vô hiệu hóa'} chương trình khuyến mãi thành công`);
        setConfirmModal({ isOpen: false, program: null });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật chương trình khuyến mãi');
        setConfirmModal({ isOpen: false, program: null });
      }
    });
  };

  const getStatusConfig = (program: PromotionProgram) => {
    const daysRemaining = getDaysRemaining(program.endDate);
    const isExpired = daysRemaining < 0;
    const isActive = !program.isDelete;

    if (!isActive) {
      return {
        variant: 'secondary' as const,
        text: 'Vô hiệu hóa',
        color: 'text-gray-600'
      };
    }

    if (isExpired) {
      return {
        variant: 'destructive' as const,
        text: 'Đã hết hạn',
        color: 'text-red-400'
      };
    }

    if (daysRemaining <= 7) {
      return {
        variant: 'default' as const,
        text: `Còn ${daysRemaining} ngày`,
        color: 'text-orange-600'
      };
    }

    return {
      variant: 'success' as const,
      text: 'Đang hoạt động',
      color: 'text-green-600'
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
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
    const apiError = error as { response?: { status?: number; data?: { message?: string } } };
    const isEmptyDataError = apiError?.response?.status === 500 &&
      apiError?.response?.data?.message === "Không có dữ liệu phù hợp";

    if (!isEmptyDataError) {
      return (
        <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản Lý Chương Trình Khuyến Mãi</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Tổng cộng {filteredPrograms.length} chương trình
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto"
            disabled={!canEdit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo Chương Trình Mới
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng chương trình</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalPrograms}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Đang hoạt động</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.activePrograms}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Vô hiệu hóa</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-600">{stats.inactivePrograms}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Sắp hết hạn</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm theo tên chương trình..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
                autoComplete="off"
              />
            </div>

            {/* Filter buttons */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('all')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                Tất cả
              </Button>
              <Button
                variant={filter === 'active' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('active')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                Hoạt động
              </Button>
              <Button
                variant={filter === 'inactive' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('inactive')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                Vô hiệu hóa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {filteredPrograms.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy chương trình khuyến mãi' : 'Chưa có chương trình khuyến mãi nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Bắt đầu tạo chương trình khuyến mãi đầu tiên'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreateModal(true)} disabled={!canEdit}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Chương Trình Mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {paginatedPrograms.map((program) => {
              const statusConfig = getStatusConfig(program);
              const daysRemaining = getDaysRemaining(program.endDate);

              return (
                <Card key={program.discountProgramID} className="hover:shadow-lg transition-shadow flex flex-col h-full">
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="space-y-3 flex-1 flex flex-col">
                      {/* Header - Fixed height */}
                      <div className="flex justify-between items-start gap-2 min-h-[3rem]">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 flex-1">
                          {program.discountProgramName}
                        </h3>
                        {statusConfig.variant === 'destructive' ? (
                          <div className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-xs font-medium shrink-0">
                            {statusConfig.text}
                          </div>
                        ) : (
                          <Badge variant={statusConfig.variant} className="text-xs shrink-0">
                            {statusConfig.text}
                          </Badge>
                        )}
                      </div>

                      {/* Dates - Fixed position */}
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 shrink-0" />
                          <span>Bắt đầu: {formatDateShort(program.createDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1 shrink-0" />
                          <span>Kết thúc: {formatDateShort(program.endDate)}</span>
                        </div>
                      </div>

                      {/* Progress indicator - Flexible spacing */}
                      <div className="flex-1 flex flex-col justify-end">
                        {!program.isDelete && daysRemaining >= 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Thời gian còn lại</span>
                              <span className={statusConfig.color}>
                                {daysRemaining === 0 ? 'Hôm nay' : `${daysRemaining} ngày`}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-300 ${daysRemaining <= 3 ? 'bg-red-500 w-2/12' :
                                  daysRemaining <= 7 ? 'bg-orange-500 w-4/12' : 'bg-green-500 w-8/12'
                                  }`}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions - Fixed at bottom */}
                      <div className="flex justify-between items-center pt-2 mt-auto">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(program.discountProgramID)}
                            className="p-1"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canEdit && program.isDelete != false && (<Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(program.discountProgramID)}
                            className="p-1"
                            title="Chỉnh sửa"
                            disabled={!canEdit}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>)}
                        </div>
                        {canEdit && (<Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeactivate(program)}
                          disabled={isDeactivating || !canEdit}
                          className={`p-2 rounded-full transition-all duration-200 ${program.isDelete
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                            : 'bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-500'
                            }`}
                          title={program.isDelete ? 'Kích hoạt' : 'Vô hiệu hóa'}
                        >
                          {program.isDelete ? (
                            <ToggleLeft className="h-5 w-5" />
                          ) : (
                            <ToggleRight className="h-5 w-5" />
                          )}
                        </Button>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-6 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              className="justify-center"
            />
          </div>
        </>
      )}

      {/* Modals */}
      {canEdit && showCreateModal && (
        <CreatePromotionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {canEdit && showEditModal.programId && (
        <EditPromotionModal
          isOpen={showEditModal.isOpen}
          onClose={() => setShowEditModal({ isOpen: false, programId: null })}
          programId={showEditModal.programId}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, program: null })}
        onConfirm={handleConfirmDeactivate}
        title={`${confirmModal.program?.isDelete ? 'Kích hoạt' : 'Vô hiệu hóa'} chương trình khuyến mãi`}
        message={
          confirmModal.program
            ? `Bạn có chắc chắn muốn ${confirmModal.program.isDelete ? 'kích hoạt' : 'vô hiệu hóa'} chương trình "${confirmModal.program.discountProgramName}"?`
            : ''
        }
        confirmText={confirmModal.program?.isDelete ? 'Kích hoạt' : 'Vô hiệu hóa'}
        confirmVariant={confirmModal.program?.isDelete ? 'default' : 'destructive'}
        isLoading={isDeactivating}
      />
    </div>
  );
};