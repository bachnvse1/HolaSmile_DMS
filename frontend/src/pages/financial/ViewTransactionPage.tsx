import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Clock, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StaffLayout } from '@/layouts/staff/StaffLayout';
import { useFinancialTransactionDetail } from '@/hooks/useFinancialTransactions';
import { formatCurrency } from '@/utils/currencyUtils';
import { useUserInfo } from '@/hooks/useUserInfo';
import { EditTransactionModal } from '@/components/financial/EditTransactionModal';

export const ViewTransactionPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const userInfo = useUserInfo();

  const [showEditModal, setShowEditModal] = useState(false);

  const { data: transaction, isLoading } = useFinancialTransactionDetail(Number(transactionId));

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateString;
    }
  };

  const getTransactionTypeConfig = (type: string | boolean) => {
    const isIncome = typeof type === 'boolean' ? type : type?.toLowerCase() === 'thu';
    return isIncome
      ? { variant: 'success' as const, icon: <TrendingUp className="h-5 w-5" />, color: 'text-green-600', badgeClass: 'bg-green-100 text-green-800', label: 'Thu' }
      : { variant: 'destructive' as const, icon: <TrendingDown className="h-5 w-5" />, color: 'text-red-600', badgeClass: 'bg-red-100 text-red-800', label: 'Chi' };
  };

  const getPaymentMethodLabel = (method: string | boolean) => {
    if (typeof method === 'boolean') {
      return method ? 'Tiền mặt' : 'Chuyển khoản';
    }
    return method;
  };

  const handleBack = () => {
    navigate('/financial-transactions');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  // Check if user can edit transaction
  const canEdit = transaction && transaction.status === 'pending' && transaction.createById === Number(userInfo?.id);

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

  if (!transaction) {
    return (
      <StaffLayout userInfo={userInfo}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Không tìm thấy giao dịch</p>
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </div>
      </StaffLayout>
    );
  }

  const typeConfig = getTransactionTypeConfig(transaction.transactionType);

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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chi Tiết Giao Dịch</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Thông tin chi tiết về giao dịch tài chính</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {canEdit && (
              <Button
                variant="outline"
                onClick={handleEdit}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Chỉnh sửa</span>
                <span className="hidden sm:inline">Chỉnh Sửa</span>
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Transaction Type & Amount */}
          <Card className={`${(typeof transaction.transactionType === 'boolean' ? transaction.transactionType : transaction.transactionType?.toLowerCase() === 'thu')
              ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-md ${typeConfig.badgeClass}`}>
                      {typeConfig.icon}
                      {typeConfig.label}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">Loại giao dịch</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${typeConfig.color}`}>
                    {formatCurrency(transaction.amount)} ₫
                  </p>
                  <p className="text-sm text-gray-600">Số tiền</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Thông tin cơ bản</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Mô tả</label>
                    <p className="text-gray-900 font-medium">{transaction.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Danh mục</label>
                    <p className="text-gray-900 font-medium">{transaction.category}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Trạng thái</label>
                    <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-md ${
                      transaction.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : transaction.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'approved' ? 'Đã duyệt' : 
                       transaction.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Phương thức thanh toán</label>
                    <p className="text-gray-900 font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Ngày giao dịch</label>
                    <div className="flex items-center text-gray-900">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">{formatDate(transaction.transactionDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evidence Image */}
          {transaction.evidenceImage && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Ảnh chứng từ</h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={transaction.evidenceImage}
                    alt="Evidence"
                    className="w-full max-w-md mx-auto h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(transaction.evidenceImage, '_blank')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Click để xem ảnh kích thước đầy đủ</p>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-6">Thông tin hệ thống</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Người tạo</label>
                    <p className="text-gray-900 font-medium">{transaction.createBy || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Ngày tạo</label>
                    <div className="flex items-center text-gray-900">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{transaction.createAt ? formatDate(transaction.createAt) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Người cập nhật</label>
                    <p className="text-gray-900 font-medium">{transaction.updateBy || 'Không có bản cập nhật'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">Ngày cập nhật</label>
                    <div className="flex items-center text-gray-900">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{transaction.updateAt ? formatDate(transaction.updateAt) : 'Không có bản cập nhật'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <EditTransactionModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            transactionId={Number(transactionId)}
          />
        )}
      </div>
    </StaffLayout>
  );
};