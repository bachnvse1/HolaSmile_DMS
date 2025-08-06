import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Calendar, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
import { usePromotionProgramDetail } from '@/hooks/usePromotions';
import { formatDateShort, getDaysRemaining } from '@/utils/date';
import { useUserInfo } from '@/hooks/useUserInfo';
import { EditPromotionModal } from '@/components/promotion/EditPromotionModal';

export const ViewPromotionPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();
  const canEdit = userInfo?.role === 'Receptionist';

  const [showEditModal, setShowEditModal] = useState(false);

  const { data: program, isLoading, error } = usePromotionProgramDetail(Number(programId));

  const getStatusConfig = () => {
    if (!program) return { variant: 'secondary' as const, text: '', color: 'text-gray-600' };
    
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
        color: 'text-red-600'
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

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleBack = () => {
    navigate('/promotions');
  };

  if (isLoading) {
    return (
      <StaffLayout userInfo={userInfo}>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải chi tiết...</p>
          </div>
        </div>
      </StaffLayout>
    );
  }

  if (error || !program) {
    return (
      <StaffLayout userInfo={userInfo}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">
            {error ? 'Có lỗi xảy ra khi tải dữ liệu' : 'Không tìm thấy thông tin chương trình khuyến mãi'}
          </p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout userInfo={userInfo}>
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-row sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack} className='border border-gray-300'>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chi Tiết Chương Trình Khuyến Mãi</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Thông tin chi tiết về chương trình</p>
            </div>
          </div>
          
          {canEdit && program.isDelete != false && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleEdit}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Chỉnh sửa</span>
                <span className="hidden sm:inline">Chỉnh Sửa</span>
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Program Info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Thông tin chương trình</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Tên chương trình</label>
                    <p className="text-gray-900 font-medium text-lg">{program.programName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Trạng thái</label>
                    <div className="mt-1">
                      <Badge variant={getStatusConfig().variant} className="text-sm px-3 py-1">
                        {getStatusConfig().text}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Ngày bắt đầu</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatDateShort(program.startDate)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Ngày kết thúc</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatDateShort(program.endDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar for active programs */}
              {!program.isDelete && getDaysRemaining(program.endDate) >= 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Thời gian còn lại</span>
                    <span className={getStatusConfig().color + ' font-medium'}>
                      {getDaysRemaining(program.endDate) === 0 ? 'Hôm nay' : `${getDaysRemaining(program.endDate)} ngày`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        getDaysRemaining(program.endDate) <= 3 ? 'bg-red-500 w-1/12' : 
                        getDaysRemaining(program.endDate) <= 7 ? 'bg-orange-500 w-3/12' : 'bg-green-500 w-8/12'
                      }`}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Procedures */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Thủ thuật áp dụng khuyến mãi</h3>
              
              {program.listProcedure && program.listProcedure.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {program.listProcedure.map((procedure, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">{procedure.procedureName}</p>
                        <p className="text-sm text-gray-600">ID: {procedure.procedureId}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-2xl text-blue-600">
                          {procedure.discountAmount}%
                        </p>
                        <p className="text-xs text-gray-500">Phần trăm giảm giá</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có thủ thuật nào được áp dụng</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Thông tin tạo/cập nhật</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-1">Tạo bởi:</span>
                    <p className="font-medium text-gray-900">{program.createBy || 'Không xác định'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-1">Ngày tạo:</span>
                    <p className="font-medium text-gray-900">{formatDateShort(program.createAt)}</p>
                  </div>
                </div>
                
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600 block mb-1">Cập nhật bởi:</span>
                      <p className="font-medium text-gray-900">{program.updateBy ? program.updateBy : 'Không có bản cập nhật'}</p>
                    </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600 block mb-1">Ngày cập nhật:</span>
                        <p className="font-medium text-gray-900">
                          {program.updateAt ? formatDateShort(program.updateAt) : 'Không có bản cập nhật'}
                        </p>
                      </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Modal */}
        {canEdit && showEditModal && (
          <EditPromotionModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            programId={Number(programId)}
          />
        )}
      </div>
    </StaffLayout>
  );
};