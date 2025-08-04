import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertTriangle,
  DollarSign,
  TrendingDown,
  Filter,
  RotateCcw,
  Download,
  Upload,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Pagination } from '@/components/ui/Pagination';
import {
  useSupplies,
  useDeactivateSupply,
  useSupplyStats,
  useDownloadExcelSupplies,
  useExportSupplies,
  useImportSupplies
} from '@/hooks/useSupplies';
import { useUserInfo } from '@/hooks/useUserInfo';
import type { Supply } from '@/types/supply';
import { getErrorMessage } from '@/utils/formatUtils';
import { formatCurrency } from '@/utils/currencyUtils'; 

export const SupplyList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'expiring'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    supply: Supply | null;
    action: 'delete' | 'restore';
  }>({
    isOpen: false,
    supply: null,
    action: 'delete'
  });
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userInfo = useUserInfo();
  const userRole = userInfo?.role || '';

  // Chỉ Administrator, Owner, Assistant có quyền edit/delete
  const canModify = ['Assistant'].includes(userRole);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: supplies = [], isLoading, error, refetch } = useSupplies(debouncedSearchQuery);
  const { data: stats, isLoading: isLoadingStats } = useSupplyStats();
  const { mutate: deactivateSupply, isPending: isDeactivating } = useDeactivateSupply();
  const { mutate: downloadExcel, isPending: isDownloadExcel } = useDownloadExcelSupplies();
  const { mutate: exportExcel, isPending: isExportExcel } = useExportSupplies();
  const { mutate: importExcel, isPending: isImporting } = useImportSupplies();

  // Filter supplies based on selected filter
  const filteredSupplies = supplies.filter(supply => {
    if (filter === 'low-stock') {
      return supply.QuantityInStock <= 10;
    }
    if (filter === 'expiring') {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      return new Date(supply.ExpiryDate) <= futureDate;
    }
    return true;
  });

  // Pagination logic
  const totalItems = filteredSupplies.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSupplies = filteredSupplies.slice(startIndex, endIndex);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist(); // Ensure event persists
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (newFilter: 'all' | 'low-stock' | 'expiring') => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleDownloadTemplate = () => {
    downloadExcel(undefined, {
      onSuccess: () => {
        toast.success('Đã tải mẫu excel thành công');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xuất file Excel');
      }
    });
  };

  const handleExportExcel = () => {
    exportExcel(undefined, {
      onSuccess: () => {
        toast.success('Đã xuất Excel thành công');
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi xuất file Excel');
      }
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
      return;
    }

    setSelectedFile(file);
  };

  const handleConfirmImport = () => {
    if (!selectedFile) return;

    importExcel(selectedFile, {
      onSuccess: () => {
        toast.success('Đã import file Excel thành công');
        refetch();
        setShowImportModal(false);
        setSelectedFile(null);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi nhập file Excel');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const handleCancelImport = () => {
    setShowImportModal(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleView = (supply: Supply) => {
    navigate(`/inventory/${supply.SupplyID}`);
  };

  const handleEdit = (supply: Supply) => {
    navigate(`/inventory/${supply.SupplyID}/edit`);
  };

  const handleDeactivate = async (supply: Supply) => {
    const isDeleted = supply.isDeleted === true;
    setConfirmModal({
      isOpen: true,
      supply: supply,
      action: isDeleted ? 'restore' : 'delete'
    });
  };

  const handleConfirmAction = () => {
    const { supply, action } = confirmModal;
    if (!supply) return;

    const actionText = action === 'delete' ? 'xóa' : 'khôi phục';
    deactivateSupply(supply.SupplyID, {
      onSuccess: () => {
        toast.success(`Đã ${actionText} vật tư thành công`);
        refetch();
        setConfirmModal({ isOpen: false, supply: null, action: 'delete' });
      },
      onError: (error) => {
        toast.error(getErrorMessage(error) || `Có lỗi xảy ra khi ${actionText} vật tư`);
        setConfirmModal({ isOpen: false, supply: null, action: 'delete' });
      }
    });
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
  };

  const getStockStatus = (quantity: number) => {
    if (quantity == 0) return { text: 'Hết hàng', color: 'text-red-600 bg-red-50' };
    if (quantity <= 10) return { text: 'Sắp hết', color: 'text-orange-600 bg-orange-50' };
    return { text: 'Còn hàng', color: 'text-green-600 bg-green-50' };
  };

  const getExpiryStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (daysDiff < 0) return { text: 'Hết hạn', color: 'text-red-600 bg-red-50' };
    if (daysDiff <= 30) return { text: 'Sắp hết hạn', color: 'text-orange-600 bg-orange-50' };
    return { text: 'Còn hạn', color: 'text-green-600 bg-green-50' };
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

  // Only show error for non-empty data errors
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
        {/* Title section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quản Lý Kho Vật Tư</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Tổng cộng {filteredSupplies.length} vật tư
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:gap-3 sm:ml-auto">
          {/* Mobile layout: 2 rows */}
          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {canModify && (supplies.length > 0) && (
              <Button
                onClick={handleExportExcel}
                disabled={isExportExcel}
                className="text-xs bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-3 w-3 mr-1" />
                <span>Xuất Excel</span>
              </Button>
            )}
            {canModify && (
              <Button
                onClick={() => setShowImportModal(true)}
                disabled={isImporting}
                className={`text-xs bg-blue-600 hover:bg-blue-700 text-white ${
                  supplies.length === 0 ? 'col-span-2' : ''
                }`}
              >
                <Upload className="h-3 w-3 mr-1" />
                <span>Nhập Excel</span>
              </Button>
            )}
          </div>

          {canModify && (
            <div className="grid grid-cols-1 gap-2 sm:hidden">
              <Button
                onClick={() => navigate('/inventory/create')}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span>Thêm Vật Tư Mới</span>
              </Button>
            </div>
          )}

          {/* Desktop layout: Single row */}
          <div className="hidden sm:flex sm:gap-3">
            {canModify && supplies.length > 0 && (
              <Button
                onClick={handleExportExcel}
                disabled={isExportExcel}
                className="text-sm bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExportExcel ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>
            )}

            {canModify && (
              <>
                <Button
                  onClick={() => setShowImportModal(true)}
                  disabled={isImporting}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Đang nhập...' : 'Nhập Excel'}
                </Button>

                <Button
                  onClick={() => navigate('/inventory/create')}
                  className="text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Vật Tư Mới
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng vật tư</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalSupplies}</p>
                </div>
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Sắp hết hàng</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{stats.lowStockCount}</p>
                </div>
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Sắp hết hạn</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.expiringSoonCount}</p>
                </div>
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Tổng giá trị</p>
                  <p className="text-sm sm:text-lg font-bold text-green-600 truncate">
                    {formatCurrency(stats.totalValue)}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                key="supply-search-input"
                placeholder="Tìm kiếm theo tên vật tư..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {/* Filter buttons - cùng hàng trên desktop, xuống dòng trên mobile */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('all')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Tất cả
              </Button>
              <Button
                variant={filter === 'low-stock' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('low-stock')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Sắp hết
              </Button>
              <Button
                variant={filter === 'expiring' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('expiring')}
                size="sm"
                className="text-xs sm:text-sm"
              >
                <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Hết hạn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplies Table - Mobile Responsive */}
      {filteredSupplies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Không tìm thấy vật tư' : 'Kho vật tư trống'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery
                ? 'Thử thay đổi từ khóa tìm kiếm của bạn'
                : 'Bắt đầu thêm vật tư đầu tiên vào kho để quản lý hiệu quả'
              }
            </p>
            {!searchQuery && canModify && (
              <Button onClick={() => navigate('/inventory/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Vật Tư Mới
              </Button>
            )}
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Xem tất cả vật tư
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="hidden lg:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên vật tư
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Đơn vị
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hạn sử dụng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Giá
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedSupplies.map((supply) => {
                      const stockStatus = getStockStatus(supply.QuantityInStock);
                      const expiryStatus = getExpiryStatus(supply.ExpiryDate);

                      return (
                        <tr key={supply.SupplyID} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{supply.Name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {supply.Unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 mr-2">
                                {supply.QuantityInStock}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm text-gray-900 mr-2">
                                {supply.ExpiryDate ? formatDate(supply.ExpiryDate) : ''}
                              </span>
                              {supply.ExpiryDate && (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${expiryStatus.color}`}>
                                  {expiryStatus.text}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(supply.Price)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex max-w-[80px] justify-center items-center text-center px-2 py-1 text-xs font-semibold rounded-md ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                              <span className={`inline-flex max-w-[80px] justify-center items-center text-center px-2 py-1 text-xs font-semibold rounded-md ${expiryStatus.color}`}>
                                {expiryStatus.text}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(supply)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canModify && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(supply)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {supply.isDeleted === true ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeactivate(supply)}
                                      disabled={isDeactivating}
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      title="Khôi phục vật tư"
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeactivate(supply)}
                                      disabled={isDeactivating}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Xóa vật tư"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
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
            {paginatedSupplies.map((supply) => {
              const stockStatus = getStockStatus(supply.QuantityInStock);
              const expiryStatus = getExpiryStatus(supply.ExpiryDate);

              return (
                <Card key={supply.SupplyID} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                            {supply.Name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            Đơn vị: {supply.Unit}
                          </p>
                        </div>
                        <div className="flex space-x-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleView(supply)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canModify && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(supply)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {supply.isDeleted === true ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeactivate(supply)}
                                  disabled={isDeactivating}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8 w-8 p-0"
                                  title="Khôi phục vật tư"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeactivate(supply)}
                                  disabled={isDeactivating}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                  title="Xóa vật tư"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Số lượng:</span>
                          <div className="flex items-center mt-1 gap-2">
                            <span className="font-medium text-gray-900">
                              {supply.QuantityInStock}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600">Giá:</span>
                          <div className="font-medium text-gray-900 mt-1 truncate">
                            {formatCurrency(supply.Price)}
                          </div>
                        </div>
                      </div>

                      {/* Expiry */}
                      <div>
                        <span className="text-gray-600 text-sm">Hạn sử dụng:</span>
                        <div className="flex items-center mt-1 gap-2">
                          <span className="text-sm text-gray-900">
                            {supply.ExpiryDate ? formatDate(supply.ExpiryDate) : ''}
                          </span>
                          {supply.ExpiryDate && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md text-align-center ${expiryStatus.color}`}>
                              {expiryStatus.text}
                            </span>
                          )}
                        </div>
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

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, supply: null, action: 'delete' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'delete' ? 'Xóa vật tư' : 'Khôi phục vật tư'}
        message={
          confirmModal.supply
            ? `Bạn có chắc chắn muốn ${confirmModal.action === 'delete' ? 'xóa' : 'khôi phục'
            } vật tư "${confirmModal.supply.Name}"?`
            : ''
        }
        confirmText={confirmModal.action === 'delete' ? 'Xóa' : 'Khôi phục'}
        confirmVariant={confirmModal.action === 'delete' ? 'destructive' : 'default'}
        isLoading={isDeactivating}
      />

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 text-center">
            <div className="fixed inset-0 bg-black opacity-50" onClick={handleCancelImport}></div>

            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nhập dữ liệu từ Excel
                </h3>
                <button
                  onClick={handleCancelImport}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Đóng</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Chọn file Excel để nhập dữ liệu vật tư. File phải có định dạng .xlsx hoặc .xls
                  </p>

                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${selectedFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-blue-400'
                      }`}
                    onClick={() => {
                      console.log('Clicking to open file dialog');
                      fileInputRef.current?.click();
                    }}
                  >
                    {selectedFile ? (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-green-600" />
                        <div className="mt-2">
                          <span className="text-green-600 font-medium">
                            {selectedFile.name}
                          </span>
                          <p className="text-gray-500 text-sm mt-1">Click để chọn file khác</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <span className="text-blue-600 hover:text-blue-500 font-medium">
                            Chọn file Excel
                          </span>
                          <p className="text-gray-500 text-sm mt-1">hoặc kéo thả file vào đây</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File input with proper event handling */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="sr-only"
                    title="Import Excel file"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  {selectedFile && (
                    <Button
                      onClick={handleConfirmImport}
                      disabled={isImporting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isImporting ? 'Đang nhập...' : 'Xác nhận nhập Excel'}
                    </Button>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                      disabled={isDownloadExcel}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloadExcel ? 'Đang tải...' : 'Tải mẫu Excel'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleCancelImport}
                      className="flex-1"
                      disabled={isImporting}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>

                {isImporting && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-600 mt-2">Đang xử lý file...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};