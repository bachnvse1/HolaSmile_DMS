import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Check, X, TrendingDown, Calendar, User, Clock, DollarSign } from 'lucide-react';
import { useExpenseTransactions, useApproveFinancialTransaction, useFinancialTransactionDetail } from '@/hooks/useFinancialTransactions';
import { formatCurrency } from '@/utils/currencyUtils';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';

interface ExpenseApprovalProps {
  viewOnlyApproved?: boolean;
}

export const ExpenseApproval: React.FC<ExpenseApprovalProps> = ({
  viewOnlyApproved = false
}) => {
  const [approveTransactionId, setApproveTransactionId] = useState<number | null>(null);
  const [viewTransactionId, setViewTransactionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { data: transactions = [], isLoading, error, refetch } = useExpenseTransactions();
  const { data: viewTransaction, isLoading: isLoadingDetail } = useFinancialTransactionDetail(viewTransactionId || 0);
  const approveMutation = useApproveFinancialTransaction();

  // Filter transactions based on view mode
  const filteredTransactions = viewOnlyApproved 
    ? transactions.filter(t => t.isConfirmed) 
    : transactions.filter(t => !t.isConfirmed);

  // Pagination logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getPaymentMethodLabel = (method: string | boolean) => {
    if (typeof method === 'boolean') {
      return method ? 'Tiền mặt' : 'Chuyển khoản';
    }
    return method;
  };

  const handleApprove = async () => {
    if (!approveTransactionId) return;
    
    try {
      await approveMutation.mutateAsync(approveTransactionId);
      toast.success('Đã phê duyệt phiếu chi thành công');
      setApproveTransactionId(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi phê duyệt');
    }
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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600">Có lỗi xảy ra khi tải dữ liệu</p>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-2"
          >
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {viewOnlyApproved ? 'Phiếu Chi Đã Phê Duyệt' : 'Phê Duyệt Phiếu Chi'}
          </h2>
          <p className="text-gray-600 mt-1">
            {viewOnlyApproved 
              ? 'Danh sách các phiếu chi đã được phê duyệt' 
              : 'Xem xét và phê duyệt các phiếu chi chờ duyệt'
            }
          </p>
        </div> */}
        <Badge variant="outline" className="text-sm border-gray-300 text-gray-600">
          {filteredTransactions.length} phiếu chi
        </Badge>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {viewOnlyApproved ? 'Chưa có phiếu chi nào được phê duyệt' : 'Không có phiếu chi nào cần phê duyệt'}
            </h3>
            <p className="text-gray-600">
              {viewOnlyApproved 
                ? 'Các phiếu chi đã được phê duyệt sẽ hiển thị ở đây'
                : 'Tất cả phiếu chi đã được xử lý'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paginatedTransactions.map((transaction) => (
            <Card key={transaction.transactionID} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                      <Badge variant="destructive" className="bg-red-100 text-red-800">
                        Phiếu Chi
                      </Badge>
                      {!viewOnlyApproved && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                          Chờ phê duyệt
                        </Badge>
                      )}
                      {viewOnlyApproved && (
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Đã phê duyệt
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {transaction.category}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>Tạo bởi: {transaction.createBy}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Ngày GD: {formatDate(transaction.transactionDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>Tạo lúc: {formatDate(transaction.createdAt || transaction.createAt || '')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span>PT: {getPaymentMethodLabel(transaction.paymentMethod)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end mb-2">
                          <DollarSign className="h-5 w-5 text-red-600" />
                          <span className="text-2xl font-bold text-red-600">
                            {formatCurrency(transaction.amount)} ₫
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewTransactionId(transaction.transactionID)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                    
                    {!viewOnlyApproved && (
                      <Button
                        size="sm"
                        onClick={() => setApproveTransactionId(transaction.transactionID)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Duyệt
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
      {totalPages > 1 && (
        <div className="mt-6 border-t border-gray-200 bg-white px-4 py-3">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={() => {}} // No items per page change for approval
            className="justify-center"
          />
        </div>
      )}

      {/* View Transaction Modal */}
      {viewTransactionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/20 bg-opacity-50" onClick={() => setViewTransactionId(null)} />
          
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Phiếu Chi</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewTransactionId(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {isLoadingDetail ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
                </div>
              </div>
            ) : viewTransaction ? (
              <div className="p-6 space-y-6">
                {/* Transaction Info */}
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-800">
                            Phiếu Chi
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{viewTransaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(viewTransaction.amount)} ₫
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mô tả</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {viewTransaction.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phương thức thanh toán</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {getPaymentMethodLabel(viewTransaction.paymentMethod)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ngày giao dịch</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {formatDate(viewTransaction.transactionDate)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Người tạo</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {viewTransaction.createBy}
                    </p>
                  </div>
                </div>

                {/* Evidence Image */}
                {viewTransaction.evidenceImage && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-600">Ảnh chứng từ</label>
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={viewTransaction.evidenceImage}
                        alt="Evidence"
                        className="w-full max-w-md mx-auto h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(viewTransaction.evidenceImage, '_blank')}
                      />
                    </div>
                    <p className="text-xs text-gray-500">Click để xem ảnh kích thước đầy đủ</p>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-300">
                  <Button variant="outline" onClick={() => setViewTransactionId(null)}>
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-red-600">Không tìm thấy giao dịch</p>
                  <Button variant="outline" onClick={() => setViewTransactionId(null)} className="mt-2">
                    Đóng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      <ConfirmModal
        isOpen={!!approveTransactionId}
        onClose={() => setApproveTransactionId(null)}
        onConfirm={handleApprove}
        title="Xác nhận phê duyệt"
        message="Bạn có chắc chắn muốn phê duyệt phiếu chi này?"
        confirmText="Phê duyệt"
        confirmVariant="default"
        isLoading={approveMutation.isPending}
      />
    </div>
  );
};