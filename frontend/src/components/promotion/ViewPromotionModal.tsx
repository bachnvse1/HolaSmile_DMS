import React from 'react';
import { X, Calendar, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePromotionProgramDetail } from '@/hooks/usePromotions';
import { formatDateShort, getDaysRemaining } from '@/utils/date';
import { formatCurrency } from '@/utils/currencyUtils';

interface ViewPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
  onEdit?: (programId: number) => void;
}

export const ViewPromotionModal: React.FC<ViewPromotionModalProps> = ({
  isOpen,
  onClose,
  programId,
  onEdit
}) => {
  const { data: program, isLoading, error } = usePromotionProgramDetail(programId);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Chương Trình Khuyến Mãi</h2>
              {program && (
                <p className="text-sm text-gray-600">{program.programName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && program && (
              <Button
                variant="outline"
                onClick={() => onEdit(program.programId)}
                size="sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải chi tiết...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                Đóng
              </Button>
            </div>
          ) : program ? (
            <div className="space-y-6">
              {/* Program Info */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Thông tin chương trình</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tên chương trình</label>
                        <p className="text-gray-900 font-medium">{program.programName}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                        <div className="mt-1">
                          <Badge variant={getStatusConfig().variant}>
                            {getStatusConfig().text}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ngày bắt đầu</label>
                        <div className="flex items-center text-gray-900">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDateShort(program.startDate)}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ngày kết thúc</label>
                        <div className="flex items-center text-gray-900">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDateShort(program.endDate)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar for active programs */}
                  {!program.isDelete && getDaysRemaining(program.endDate) >= 0 && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Thời gian còn lại</span>
                        <span className={getStatusConfig().color}>
                          {getDaysRemaining(program.endDate) === 0 ? 'Hôm nay' : `${getDaysRemaining(program.endDate)} ngày`}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
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
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Thủ thuật áp dụng khuyến mãi</h3>
                  
                  {program.listProcedure && program.listProcedure.length > 0 ? (
                    <div className="space-y-3">
                      {program.listProcedure.map((procedure, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{procedure.procedureName}</p>
                            <p className="text-sm text-gray-600">ID: {procedure.procedureId}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-blue-600">
                              {formatCurrency(procedure.discountAmount)} ₫
                            </p>
                            <p className="text-xs text-gray-500">Giá khuyến mãi</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Chưa có thủ thuật nào được áp dụng</p>
                  )}
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-4">Thông tin tạo/cập nhật</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Tạo bởi:</span>
                        <p className="font-medium">{program.createBy || 'Không xác định'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Ngày tạo:</span>
                        <p className="font-medium">{formatDateShort(program.createAt)}</p>
                      </div>
                    </div>
                    
                    {program.updateBy && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600">Cập nhật bởi:</span>
                          <p className="font-medium">{program.updateBy}</p>
                        </div>
                        {program.updateAt && (
                          <div>
                            <span className="text-gray-600">Ngày cập nhật:</span>
                            <p className="font-medium">{formatDateShort(program.updateAt)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Không tìm thấy thông tin chương trình khuyến mãi</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-300 bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
          {onEdit && program && (
            <Button onClick={() => onEdit(program.programId)}>
              <Edit className="h-4 w-4 mr-2" />
              Chỉnh sửa
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};