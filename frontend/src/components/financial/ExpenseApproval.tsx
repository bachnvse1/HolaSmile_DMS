import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Check, X, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { useApproveFinancialTransaction, useFinancialTransactionDetail, useFinancialTransactions, usePendingTransactions } from '@/hooks/useFinancialTransactions';
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
  const [rejectTransactionId, setRejectTransactionId] = useState<number | null>(null);
  const [viewTransactionId, setViewTransactionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Use pending transactions hook for approval list, all transactions for approved list
  const { data: pendingTransactions = [], isLoading: isLoadingPending, error: pendingError, refetch: refetchPending } = usePendingTransactions();
  const { data: allTransactions = [], isLoading: isLoadingAll, error: allError, refetch: refetchAll } = useFinancialTransactions();

  // Choose the right data source and loading state
  const rawTransactions = viewOnlyApproved ? allTransactions : pendingTransactions;
  const isLoading = viewOnlyApproved ? isLoadingAll : isLoadingPending;
  const error = viewOnlyApproved ? allError : pendingError;
  const refetch = viewOnlyApproved ? refetchAll : refetchPending;

  const { data: viewTransaction, isLoading: isLoadingDetail } = useFinancialTransactionDetail(viewTransactionId || 0);
  const approveMutation = useApproveFinancialTransaction();

  // Filter transactions based on view mode
  const filteredTransactions = React.useMemo(() => {
    let filtered = viewOnlyApproved
      ? rawTransactions.filter(t => t.status === 'approved') // All approved transactions (both Thu and Chi)
      : rawTransactions.filter(t => t.status === 'pending'); // All pending transactions (both Thu and Chi)

    // Sort by created date (newest first)
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createAt || a.createdAt || a.transactionDate);
      const dateB = new Date(b.createAt || b.createdAt || b.transactionDate);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [viewOnlyApproved, rawTransactions]);

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

  const getTransactionTypeConfig = (type: string | boolean) => {
    const isIncome = typeof type === 'boolean' ? type : type?.toLowerCase() === 'thu';
    return isIncome
      ? {
        variant: 'success' as const,
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-green-600',
        badgeClass: 'bg-green-100 text-green-800',
        label: 'Thu'
      }
      : {
        variant: 'destructive' as const,
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'text-red-600',
        badgeClass: 'bg-red-100 text-red-800',
        label: 'Chi'
      };
  };

  const handleApprove = async () => {
    if (!approveTransactionId) return;

    try {
      await approveMutation.mutateAsync({ transactionId: approveTransactionId, action: true });
      toast.success('Đã phê duyệt giao dịch thành công');
      setApproveTransactionId(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi phê duyệt');
    }
  };

  const handleReject = async () => {
    if (!rejectTransactionId) return;

    try {
      await approveMutation.mutateAsync({ transactionId: rejectTransactionId, action: false });
      toast.success('Đã từ chối giao dịch thành công');
      setRejectTransactionId(null);
      refetch();
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi từ chối');
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
          {filteredTransactions.length} giao dịch
        </Badge>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {viewOnlyApproved ? 'Chưa có giao dịch nào được phê duyệt' : 'Không có giao dịch nào cần phê duyệt'}
            </h3>
            <p className="text-gray-600">
              {viewOnlyApproved
                ? 'Các giao dịch đã được phê duyệt sẽ hiển thị ở đây'
                : 'Tất cả giao dịch đã được xử lý'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loại
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số tiền
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phương thức
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thời gian
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTransactions.map((transaction) => {
                      const typeConfig = getTransactionTypeConfig(transaction.transactionType);

                      return (
                        <tr key={transaction.transactionID} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md ${typeConfig.badgeClass}`}>
                              {typeConfig.icon}
                              {typeConfig.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${transaction.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {transaction.status === 'approved' ? 'Đã duyệt' :
                                transaction.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div
                              className="text-sm text-gray-900 max-w-xs truncate"
                              title={transaction.description}
                            >
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{transaction.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${typeConfig.color}`}>
                              {formatCurrency(transaction.amount)} ₫
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{getPaymentMethodLabel(transaction.paymentMethod)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(transaction.transactionDate)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewTransactionId(transaction.transactionID)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {!viewOnlyApproved && transaction.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setApproveTransactionId(transaction.transactionID)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Phê duyệt"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setRejectTransactionId(transaction.transactionID)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Từ chối"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3 sm:space-y-4">
            {paginatedTransactions.map((transaction) => {
              const typeConfig = getTransactionTypeConfig(transaction.transactionType);

              return (
                <Card key={transaction.transactionID} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md ${typeConfig.badgeClass}`}>
                            {typeConfig.icon}
                            {typeConfig.label}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${transaction.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {transaction.status === 'approved' ? 'Đã duyệt' :
                              transaction.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {formatDate(transaction.transactionDate)}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-600">{transaction.category}</p>
                      </div>

                      {/* Amount and Payment Method */}
                      <div className="flex items-center justify-between">
                        <div className={`text-lg font-bold ${typeConfig.color}`}>
                          {formatCurrency(transaction.amount)} ₫
                        </div>
                        <div className="text-xs text-gray-600">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewTransactionId(transaction.transactionID)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>

                        {!viewOnlyApproved && transaction.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setApproveTransactionId(transaction.transactionID)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRejectTransactionId(transaction.transactionID)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
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
            onItemsPerPageChange={() => { }} // No items per page change for approval
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
                <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Giao Dịch</h2>
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
                <Card className={`${typeof viewTransaction.transactionType === 'boolean'
                  ? (viewTransaction.transactionType ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                  : (viewTransaction.transactionType?.toLowerCase() === 'thu' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                  }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md ${typeof viewTransaction.transactionType === 'boolean'
                            ? (viewTransaction.transactionType ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                            : (viewTransaction.transactionType?.toLowerCase() === 'thu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                            }`}>
                            {typeof viewTransaction.transactionType === 'boolean'
                              ? (viewTransaction.transactionType ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />)
                              : (viewTransaction.transactionType?.toLowerCase() === 'thu' ? <TrendingUp className="h-5 w-5 text-green-600" /> : <TrendingDown className="h-5 w-5 text-red-600" />)
                            }
                            {typeof viewTransaction.transactionType === 'boolean'
                              ? (viewTransaction.transactionType ? 'Phiếu Thu' : 'Phiếu Chi')
                              : (viewTransaction.transactionType?.toLowerCase() === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi')
                            }
                          </span>
                          <p className="text-sm text-gray-600 mt-1">{viewTransaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${typeof viewTransaction.transactionType === 'boolean'
                          ? (viewTransaction.transactionType ? 'text-green-600' : 'text-red-600')
                          : (viewTransaction.transactionType?.toLowerCase() === 'thu' ? 'text-green-600' : 'text-red-600')
                          }`}>
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
                    <p className="text-sm text-gray-900 mt-1 rounded">
                      {viewTransaction.description}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Phương thức thanh toán</label>
                    <p className="text-sm text-gray-900 mt-1 rounded">
                      {getPaymentMethodLabel(viewTransaction.paymentMethod)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Ngày giao dịch</label>
                    <p className="text-sm text-gray-900 mt-1 rounded">
                      {formatDate(viewTransaction.transactionDate)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Người tạo</label>
                    <p className="text-sm text-gray-900 mt-1 rounded">
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
        message="Bạn có chắc chắn muốn phê duyệt giao dịch này?"
        confirmText="Phê duyệt"
        confirmVariant="default"
        isLoading={approveMutation.isPending}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!rejectTransactionId}
        onClose={() => setRejectTransactionId(null)}
        onConfirm={handleReject}
        title="Xác nhận từ chối"
        message="Bạn có chắc chắn muốn từ chối giao dịch này?"
        confirmText="Từ chối"
        confirmVariant="destructive"
        isLoading={approveMutation.isPending}
      />
    </div>
  );
};