import React, { useState } from 'react';
import { Plus, Download, Search, TrendingUp, TrendingDown, Receipt, Calendar, Edit, Eye, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useFinancialTransactions, useExportFinancialTransactions, useDeactivateFinancialTransaction } from '@/hooks/useFinancialTransactions';
import { formatCurrency } from '@/utils/currencyUtils';
import { getErrorMessage } from '@/utils/formatUtils';
import { CreateTransactionModal } from './CreateTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';

export const FinancialTransactionList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filter, setFilter] = useState<'all' | 'thu' | 'chi'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'all' | 'cash' | 'transfer'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState<number | null>(null);
  const [deleteTransaction, setDeleteTransaction] = useState<number | null>(null);
  const navigate = useNavigate();

  const { data: transactions = [], isLoading, error } = useFinancialTransactions();
  const { mutate: exportTransactions, isPending: isExporting } = useExportFinancialTransactions();
  const { mutate: deactivateTransaction, isPending: isDeleting } = useDeactivateFinancialTransaction();

  // Filter and search transactions
  const filteredTransactions = React.useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(transaction => {
        const isIncome = typeof transaction.transactionType === 'boolean' 
          ? transaction.transactionType 
          : transaction.transactionType?.toLowerCase() === 'thu';
        
        if (filter === 'thu') return isIncome;
        if (filter === 'chi') return !isIncome;
        return true;
      });
    }

    // Filter by payment method
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        const isCash = typeof transaction.paymentMethod === 'boolean' 
          ? transaction.paymentMethod 
          : transaction.paymentMethod?.toLowerCase() === 'tiền mặt';
        
        if (paymentMethodFilter === 'cash') return isCash;
        if (paymentMethodFilter === 'transfer') return !isCash;
        return true;
      });
    }

    // Filter by date range
    if (dateFilter.startDate || dateFilter.endDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
        return true;
      });
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort by created date (newest first) - using createAt field
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.createAt || a.transactionDate);
      const dateB = new Date(b.createAt || b.transactionDate);
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [transactions, filter, paymentMethodFilter, searchQuery, dateFilter]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalIncome = transactions
      .filter(t => typeof t.transactionType === 'boolean' ? t.transactionType : t.transactionType?.toLowerCase() === 'thu')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
      .filter(t => typeof t.transactionType === 'boolean' ? !t.transactionType : t.transactionType?.toLowerCase() === 'chi')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense
    };
  }, [transactions]);

  // Pagination logic
  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilter: 'all' | 'thu' | 'chi') => {
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

  const handleExport = () => {
    exportTransactions(undefined, {
      onSuccess: () => {
        toast.success('Đã xuất dữ liệu thành công');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xuất dữ liệu');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTransaction) return;
    
    deactivateTransaction(deleteTransaction, {
      onSuccess: () => {
        toast.success('Đã xóa giao dịch thành công');
        setDeleteTransaction(null);
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xóa giao dịch');
      }
    });
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

  const getTransactionTypeConfig = (type: string | boolean) => {
    const isIncome = typeof type === 'boolean' ? type : type?.toLowerCase() === 'thu';
    return isIncome 
      ? { variant: 'success' as const, icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-600', badgeClass: 'bg-green-100 text-green-800 hover:bg-green-200', label: 'Thu' }
      : { variant: 'destructive' as const, icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-600', badgeClass: 'bg-red-100 text-red-800 hover:bg-red-200', label: 'Chi' };
  };

  const getPaymentMethodLabel = (method: string | boolean) => {
    if (typeof method === 'boolean') {
      return method ? 'Tiền mặt' : 'Chuyển khoản';
    }
    return method;
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
    const apiError = error as { response?: { status?: number; data?: { message?: string } } };
    const isEmptyDataError = apiError?.response?.status === 500 && 
                             apiError?.response?.data?.message === "Không có dữ liệu phù hợp";
    
    if (!isEmptyDataError) {
      return (
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
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end">
        <Button
          onClick={handleExport}
          disabled={isExporting || transactions.length === 0}
          className="text-sm bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
        </Button>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="text-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tạo Giao Dịch
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng giao dịch</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
              </div>
              <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng thu</p>
                <p className="text-sm sm:text-lg font-bold text-green-600 truncate">
                  {formatCurrency(stats.totalIncome) || 0} ₫
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng chi</p>
                <p className="text-sm sm:text-lg font-bold text-red-600 truncate">
                  {formatCurrency(stats.totalExpense) || 0} ₫
                </p>
              </div>
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Số dư ròng</p>
                <p className={`text-sm sm:text-lg font-bold truncate ${
                  stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(stats.netAmount))} ₫
                </p>
              </div>
              <div className={`h-6 w-6 sm:h-8 sm:w-8 ${
                stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.netAmount >= 0 ? <TrendingUp /> : <TrendingDown />}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo mô tả hoặc danh mục..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-10"
                  autoComplete="off"
                />
              </div>

              {/* Filter Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Bộ lọc
                {isFilterExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            {/* Expandable Filter Section */}
            {isFilterExpanded && (
              <div className="border-t border-gray-300 pt-4 space-y-4">
                {/* Type Filter Row */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Loại giao dịch
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('all')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Tất cả
                      </Button>
                      <Button
                        variant={filter === 'thu' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('thu')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Thu
                      </Button>
                      <Button
                        variant={filter === 'chi' ? 'default' : 'outline'}
                        onClick={() => handleFilterChange('chi')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Chi
                      </Button>
                    </div>
                  </div>

                  {/* Payment Method Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phương thức thanh toán
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={paymentMethodFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethodFilter('all')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Tất cả
                      </Button>
                      <Button
                        variant={paymentMethodFilter === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethodFilter('cash')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Tiền mặt
                      </Button>
                      <Button
                        variant={paymentMethodFilter === 'transfer' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethodFilter('transfer')}
                        size="sm"
                        className="text-xs sm:text-sm"
                      >
                        Chuyển khoản
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Date Filter Row */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Từ ngày
                      </label>
                      <Input
                        type="date"
                        value={dateFilter.startDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đến ngày
                      </label>
                      <Input
                        type="date"
                        value={dateFilter.endDate}
                        onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  {(dateFilter.startDate || dateFilter.endDate || filter !== 'all' || paymentMethodFilter !== 'all') && (
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateFilter({ startDate: '', endDate: '' });
                          setFilter('all');
                          setPaymentMethodFilter('all');
                        }}
                        className="text-xs sm:text-sm"
                      >
                        Xóa tất cả bộ lọc
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy giao dịch' : 'Chưa có giao dịch nào'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Bắt đầu tạo giao dịch đầu tiên'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo Giao Dịch
              </Button>
            )}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            {transaction.isConfirmed !== undefined ? (
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${
                                transaction.isConfirmed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {transaction.isConfirmed ? 'Đã duyệt' : 'Chờ duyệt'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-800">
                                N/A
                              </span>
                            )}
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/financial-transactions/${transaction.transactionID}`)}
                                className="text-gray-600 hover:text-gray-900"
                                title="Xem chi tiết"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditTransaction(transaction.transactionID)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Chỉnh sửa"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
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
                          {transaction.isConfirmed !== undefined && (
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-md ${
                              transaction.isConfirmed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.isConfirmed ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                          )}
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
                          onClick={() => navigate(`/financial-transactions/${transaction.transactionID}`)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditTransaction(transaction.transactionID)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Sửa
                        </Button>
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
      {showCreateModal && (
        <CreateTransactionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editTransaction && (
        <EditTransactionModal
          isOpen={!!editTransaction}
          onClose={() => setEditTransaction(null)}
          transactionId={editTransaction}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteTransaction}
        onClose={() => setDeleteTransaction(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        confirmVariant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};