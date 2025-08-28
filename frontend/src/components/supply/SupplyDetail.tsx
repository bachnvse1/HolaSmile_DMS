import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Edit, Trash2, Calendar, Package, DollarSign, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SupplyFormModal } from './SupplyFormModal';
import { useSupply, useDeactivateSupply } from '@/hooks/useSupplies';
import { useUserInfo } from '@/hooks/useUserInfo';
import { formatCurrency } from '@/utils/currencyUtils';

export const SupplyDetail: React.FC = () => {
  const navigate = useNavigate();
  const { supplyId } = useParams();

  const { data: supply, isLoading } = useSupply(Number(supplyId) || 0);
  const { mutate: deactivateSupply, isPending: isDeactivating } = useDeactivateSupply();

  const userInfo = useUserInfo();
  const userRole = userInfo?.role || '';

  const canModify = ['Assistant'].includes(userRole);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: 'delete' | 'restore';
  }>({
    isOpen: false,
    action: 'delete'
  });

  const [editModal, setEditModal] = useState(false);

  const handleEdit = () => {
    setEditModal(true);
  };

  const handleDeactivate = async () => {
    if (!supply) return;

    const isDeleted = supply.isDeleted === true;
    setConfirmModal({
      isOpen: true,
      action: isDeleted ? 'restore' : 'delete'
    });
  };

  const handleConfirmAction = () => {
    if (!supply) return;

    const action = confirmModal.action;
    const actionText = action === 'delete' ? 'xóa' : 'khôi phục';

    deactivateSupply(supply.SupplyID, {
      onSuccess: () => {
        toast.success(`Đã ${actionText} vật tư thành công`);
        setConfirmModal({ isOpen: false, action: 'delete' });
        navigate('/inventory');
      },
      onError: () => {
        toast.error(`Có lỗi xảy ra khi ${actionText} vật tư`);
        setConfirmModal({ isOpen: false, action: 'delete' });
      }
    });
  };

  const handleGoBack = () => {
    navigate('/inventory');
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (
      isNaN(date.getTime()) ||                
      date.getTime() === 0 ||             
      date.getFullYear() <= 1                
    ) {
      return '';
    }

    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // const getStockStatus = (quantity: number) => {
  //   if (quantity <= 0) return { text: 'Hết hàng', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
  //   if (quantity <= 10) return { text: 'Sắp hết', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle };
  //   return { text: 'Còn hàng', color: 'text-green-600 bg-green-50', icon: Package };
  // };

  // const getExpiryStatus = (expiryDate: string) => {
  //   const expiry = new Date(expiryDate);
  //   const now = new Date();
  //   const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));

  //   if (daysDiff < 0) return { text: 'Hết hạn', color: 'text-red-600 bg-red-50', days: daysDiff };
  //   if (daysDiff <= 30) return { text: 'Sắp hết hạn', color: 'text-orange-600 bg-orange-50', days: daysDiff };
  //   return { text: 'Còn hạn', color: 'text-green-600 bg-green-50', days: daysDiff };
  // };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!supply) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600">Không tìm thấy vật tư</p>
            <Button variant="outline" onClick={handleGoBack} className="mt-2">
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // const stockStatus = getStockStatus(supply.QuantityInStock);
  // const expiryStatus = getExpiryStatus(supply.ExpiryDate);
  // const totalValue = supply.Price * supply.QuantityInStock;

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-row sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Chi Tiết Vật Tư</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Thông tin chi tiết về vật tư</p>
          </div>
        </div>

        {canModify && (
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
            {supply.isDeleted === true ? (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="sm:hidden">{isDeactivating ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                <span className="hidden sm:inline">{isDeactivating ? 'Đang khôi phục...' : 'Khôi phục'}</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="sm:hidden">{isDeactivating ? 'Đang xóa...' : 'Xóa'}</span>
                <span className="hidden sm:inline">{isDeactivating ? 'Đang xóa...' : 'Xóa'}</span>
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
              Thông Tin Cơ Bản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Tên Vật Tư</label>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1 break-words word-wrap overflow-wrap-anywhere">
                  {supply.Name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Đơn Vị</label>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1">
                  {supply.Unit}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Số Lượng Trong Kho</label>
                <div className="flex flex-col sm:flex-row sm:items-center mt-1 gap-2">
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {supply.QuantityInStock}
                  </p>
                  {/* <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-md ${stockStatus.color} w-fit`}>
                    <stockStatus.icon className="h-4 w-4 mr-1" />
                    {stockStatus.text}
                  </span> */}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Giá Đơn Vị</label>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mt-1 break-words word-wrap overflow-wrap-anywhere">
                  {formatCurrency(supply.Price)} ₫
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expiry and Value Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Hạn Sử Dụng
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* <div className="space-y-3">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {new Date(supply.ExpiryDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-md ${expiryStatus.color}`}>
                    {expiryStatus.text}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  {expiryStatus.days > 0
                    ? `Còn ${expiryStatus.days} ngày`
                    : `Đã hết hạn ${Math.abs(expiryStatus.days)} ngày`
                  }
                </div>
              </div> */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Giá Trị Tồn Kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-base sm:text-lg font-semibold text-green-600 break-words word-wrap overflow-wrap-anywhere">
                    {/* {formatCurrency(totalValue)} ₫ */}
                  </p>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="break-words word-wrap overflow-wrap-anywhere">Giá đơn vị: {formatCurrency(supply.Price)} ₫</div>
                  <div>Số lượng: {supply.QuantityInStock} {supply.Unit}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Thông Tin Hệ Thống</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="break-words word-wrap overflow-wrap-anywhere">Tạo lúc: {formatDate(supply.CreatedAt)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-6 flex-shrink-0"></span>
                  {/* <span className="break-words word-wrap overflow-wrap-anywhere">Tạo bởi: {supply.CreatedBy && supply.CreatedBy !== 0 && supply.CreatedBy !== null && supply.CreatedBy !== undefined ? supply.CreatedBy : 'Chưa có'}</span> */}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="break-words word-wrap overflow-wrap-anywhere">Cập nhật: {formatDate(supply.UpdatedAt) || 'Chưa có cập nhật'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="w-6 flex-shrink-0"></span>
                  {/* <span className="break-words word-wrap overflow-wrap-anywhere">Cập nhật bởi: {supply.UpdatedBy && supply.UpdatedBy !== 0 && supply.UpdatedBy !== null && supply.UpdatedBy !== undefined && String(supply.UpdatedBy).toLowerCase() !== 'unknown' ? supply.UpdatedBy : 'Chưa có'}</span> */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {/* {(stockStatus.text !== 'Còn hàng' || expiryStatus.text !== 'Còn hạn') && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-orange-800 flex items-center">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Cảnh Báo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stockStatus.text !== 'Còn hàng' && (
                  <div className="flex items-start text-orange-700">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Vật tư {stockStatus.text.toLowerCase()}, cần nhập thêm</span>
                  </div>
                )}
                {expiryStatus.text !== 'Còn hạn' && (
                  <div className="flex items-start text-orange-700">
                    <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">
                      Vật tư {expiryStatus.text.toLowerCase()}
                      {expiryStatus.days > 0 && `, còn ${expiryStatus.days} ngày`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )} */}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: 'delete' })}
        onConfirm={handleConfirmAction}
        title={confirmModal.action === 'delete' ? 'Xóa vật tư' : 'Khôi phục vật tư'}
        message={
          supply
            ? `Bạn có chắc chắn muốn ${confirmModal.action === 'delete' ? 'xóa' : 'khôi phục'
            } vật tư "${supply.Name}"?`
            : ''
        }
        confirmText={confirmModal.action === 'delete' ? 'Xóa' : 'Khôi phục'}
        confirmVariant={confirmModal.action === 'delete' ? 'destructive' : 'default'}
        isLoading={isDeactivating}
      />

      {/* Supply Form Modal */}
      <SupplyFormModal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        mode="edit"
        supplyId={Number(supplyId)}
      />
    </div>
  );
};