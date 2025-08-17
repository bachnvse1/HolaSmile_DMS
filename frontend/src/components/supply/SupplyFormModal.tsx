import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useSupply,
  useCreateSupply,
  useUpdateSupply
} from '@/hooks/useSupplies';
import { SupplyUnit } from '@/types/supply';
import { useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/utils/formatUtils';
import { formatCurrency, handleCurrencyInput, parseCurrency } from '@/utils/currencyUtils';

const supplySchema = z.object({
  name: z.string().min(1, 'Tên vật tư là bắt buộc'),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
  quantityInStock: z.coerce.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0'),
  expiryDate: z.string().min(1, 'Hạn sử dụng là bắt buộc'),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
});

type SupplyFormData = z.infer<typeof supplySchema>;

interface SupplyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplyId?: number;
  mode: 'create' | 'edit';
}

export const SupplyFormModal: React.FC<SupplyFormModalProps> = ({
  isOpen,
  onClose,
  supplyId,
  mode
}) => {
  const { data: supply, isLoading: isLoadingSupply } = useSupply(
    mode === 'edit' ? Number(supplyId) || 0 : 0
  );

  const { mutate: createSupply, isPending: isCreating } = useCreateSupply();
  const { mutate: updateSupply, isPending: isUpdating } = useUpdateSupply();

  const isLoading = isCreating || isUpdating;
  const queryClient = useQueryClient();
  
  const form = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      name: '',
      unit: '',
      quantityInStock: 0,
      expiryDate: '',
      price: 0,
    },
  });

  const [priceDisplayValue, setPriceDisplayValue] = React.useState<string>('');

  // Load supply data for edit mode
  useEffect(() => {
    if (mode === 'edit' && supply) {
      form.reset({
        name: supply.Name,
        unit: supply.Unit,
        quantityInStock: supply.QuantityInStock,
        expiryDate: supply.ExpiryDate.split('T')[0],
        price: supply.Price,
      });
      setPriceDisplayValue(formatCurrency(supply.Price));
    } else if (mode === 'create') {
      form.reset({
        name: '',
        unit: '',
        quantityInStock: 0,
        expiryDate: '',
        price: 0,
      });
      setPriceDisplayValue('');
    }
  }, [supply, mode, form, isOpen]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleCurrencyInput(value, (formattedValue) => {
      setPriceDisplayValue(formattedValue);
      const numericValue = parseCurrency(formattedValue);
      form.setValue('price', numericValue);
    });
  };

  const onSubmit = async (data: SupplyFormData) => {
    try {
      if (mode === 'create') {
        createSupply({
          supplyName: data.name,
          unit: data.unit,
          quantityInStock: data.quantityInStock,
          price: data.price,
          expiryDate: new Date(data.expiryDate).toISOString(),
        }, {
          onSuccess: (response) => {
            const result = response as { message?: string };
            toast.success(result.message || 'Tạo vật tư thành công');
            queryClient.invalidateQueries({ queryKey: ['supplies'] });
            onClose();
          },
          onError: (error) => {
            toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi tạo vật tư');
          }
        });
      } else {
        updateSupply({
          supplyId: Number(supplyId) || 0,
          supplyName: data.name,
          unit: data.unit,
          quantityInStock: data.quantityInStock,
          price: data.price,
          expiryDate: new Date(data.expiryDate).toISOString(),
        }, {
          onSuccess: (response) => {
            const result = response as { message?: string };
            queryClient.invalidateQueries({ queryKey: ['supplies'] });
            queryClient.invalidateQueries({ queryKey: ['supply', supplyId] });
            toast.success(result.message || 'Cập nhật vật tư thành công');
            onClose();
          },
          onError: (error) => {
            toast.error(getErrorMessage(error) || 'Có lỗi xảy ra khi cập nhật vật tư');
          }
        });
      }
    } catch {
      toast.error(`Có lỗi xảy ra khi ${mode === 'create' ? 'tạo' : 'cập nhật'} vật tư`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/20 bg-opacity-75" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {mode === 'create' ? 'Thêm Vật Tư Mới' : 'Chỉnh Sửa Vật Tư'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Loading state for edit mode */}
          {mode === 'edit' && isLoadingSupply ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên Vật Tư <span className='text-red-400'>*</span>
                  </label>
                  <Input
                    placeholder="VD: Khẩu trang y tế 3 lớp"
                    {...form.register('name')}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn Vị <span className='text-red-400'>*</span>
                  </label>
                  <Select
                    value={form.watch('unit')}
                    onValueChange={(value) => form.setValue('unit', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn đơn vị" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SupplyUnit).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.unit && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.unit.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số Lượng Trong Kho {mode === 'create' ? <span className='text-red-400'>*</span> : ''}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    {...form.register('quantityInStock')}
                    className={mode === 'edit' ? 'bg-gray-50' : ''}
                    disabled={mode === 'edit'}
                  />
                  {mode === 'edit' ? (
                    <p className="text-xs text-gray-500 mt-1">
                      Số lượng chỉ có thể thay đổi thông qua nhập/xuất kho
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      Nhập số lượng ban đầu trong kho
                    </p>
                  )}
                  {form.formState.errors.quantityInStock && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.quantityInStock.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hạn Sử Dụng <span className='text-red-400'>*</span>
                  </label>
                  <Input
                    type="date"
                    {...form.register('expiryDate')}
                  />
                  {form.formState.errors.expiryDate && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.expiryDate.message}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá (VNĐ) <span className='text-red-400'>*</span>
                  </label>
                  <Input
                    placeholder="0"
                    value={priceDisplayValue}
                    onChange={handlePriceChange}
                  />
                  {form.formState.errors.price && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Nhập giá đơn vị của vật tư
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-300">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="min-w-[120px]"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading
                    ? (mode === 'create' ? 'Đang tạo...' : 'Đang cập nhật...')
                    : (mode === 'create' ? 'Tạo Vật Tư' : 'Cập Nhật')
                  }
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};