import React from 'react';
import { X, Eye, TrendingUp, TrendingDown, Calendar, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFinancialTransactionDetail } from '@/hooks/useFinancialTransactions';
import { formatCurrency } from '@/utils/currencyUtils';

interface ViewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
}

export const ViewTransactionModal: React.FC<ViewTransactionModalProps> = ({
  isOpen,
  onClose,
  transactionId
}) => {
  const { data: transaction, isLoading } = useFinancialTransactionDetail(transactionId);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // Use 24-hour format
      });
    } catch {
      return dateString;
    }
  };

  const getTransactionTypeConfig = (type: string | boolean) => {
    // Handle both string and boolean types from backend
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Chi Tiết Giao Dịch</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : transaction ? (
          /* Content */
          <div className="p-6 space-y-6">
            {/* Transaction Type & Amount */}
            <Card className={`${
              (typeof transaction.transactionType === 'boolean' ? transaction.transactionType : transaction.transactionType?.toLowerCase() === 'thu') 
                ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTransactionTypeConfig(transaction.transactionType).icon}
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md ${getTransactionTypeConfig(transaction.transactionType).badgeClass}`}>
                        {getTransactionTypeConfig(transaction.transactionType).label}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">Loại giao dịch</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTransactionTypeConfig(transaction.transactionType).color}`}>
                      {formatCurrency(transaction.amount)} ₫
                    </p>
                    <p className="text-sm text-gray-600">Số tiền</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Thông tin cơ bản</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Mô tả</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {transaction.description}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Danh mục</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {transaction.category}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phương thức thanh toán</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ngày giao dịch</label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {formatDate(transaction.transactionDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Thông tin hệ thống</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Người tạo</label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {transaction.createBy || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ngày tạo</label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {transaction.createAt ? formatDate(transaction.createAt) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {transaction.updateBy && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Người cập nhật</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {transaction.updateBy}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {transaction.updateAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ngày cập nhật</label>
                      <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-900">
                          {formatDate(transaction.updateAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-gray-300">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          /* Error State */
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-600">Không tìm thấy giao dịch</p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};