import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  useSupply, 
  useCreateSupply, 
  useUpdateSupply 
} from '@/hooks/useSupplies';
import { SupplyUnit } from '@/types/supply';

const supplySchema = z.object({
  supplyName: z.string().min(1, 'Tên vật tư là bắt buộc'),
  unit: z.string().min(1, 'Đơn vị là bắt buộc'),
  quantityInStock: z.coerce.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0'),
  expiryDate: z.string().min(1, 'Hạn sử dụng là bắt buộc'),
  price: z.coerce.number().min(0, 'Giá phải lớn hơn hoặc bằng 0'),
});

type SupplyFormData = z.infer<typeof supplySchema>;

interface SupplyFormProps {
  mode: 'create' | 'edit';
  supplyId?: number;
}

export const SupplyForm: React.FC<SupplyFormProps> = ({ mode, supplyId }) => {
  const navigate = useNavigate();
  const { data: supply, isLoading: isLoadingSupply } = useSupply(
    mode === 'edit' ? Number(supplyId) || 0 : 0
  );
  
  const { mutate: createSupply, isPending: isCreating } = useCreateSupply();
  const { mutate: updateSupply, isPending: isUpdating } = useUpdateSupply();
  
  const isLoading = isCreating || isUpdating;

  const form = useForm<SupplyFormData>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      supplyName: '',
      unit: '',
      quantityInStock: 0,
      expiryDate: '',
      price: 0,
    },
  });

  // Load supply data for edit mode
  useEffect(() => {
    if (mode === 'edit' && supply) {
      form.reset({
        supplyName: supply.Name,
        unit: supply.Unit,
        quantityInStock: supply.QuantityInStock,
        expiryDate: supply.ExpiryDate.split('T')[0], // Format for date input
        price: supply.Price,
      });
    }
  }, [supply, mode, form]);

  const onSubmit = async (data: SupplyFormData) => {
    try {
      if (mode === 'create') {
        createSupply({
          ...data,
          expiryDate: new Date(data.expiryDate).toISOString(),
        }, {
          onSuccess: () => {
            toast.success('Tạo vật tư thành công');
            navigate('/inventory');
          },
          onError: () => {
            toast.error('Có lỗi xảy ra khi tạo vật tư');
          }
        });
      } else {
        updateSupply({
          supplyId: Number(supplyId) || 0,
          ...data,
          expiryDate: new Date(data.expiryDate).toISOString(),
        }, {
          onSuccess: () => {
            toast.success('Cập nhật vật tư thành công');
            navigate('/inventory');
          },
          onError: () => {
            toast.error('Có lỗi xảy ra khi cập nhật vật tư');
          }
        });
      }
    } catch {
      toast.error(`Có lỗi xảy ra khi ${mode === 'create' ? 'tạo' : 'cập nhật'} vật tư`);
    }
  };

  const handleGoBack = () => {
    navigate('/inventory');
  };

  const formatPrice = (value: string) => {
    // Remove non-digits
    const numericValue = value.replace(/\D/g, '');
    // Format with thousand separators
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPrice(e.target.value);
    e.target.value = formattedValue;
    // Update form with numeric value
    const numericValue = parseInt(formattedValue.replace(/,/g, '')) || 0;
    form.setValue('price', numericValue);
  };

  if (mode === 'edit' && isLoadingSupply) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !supply) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
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

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Thêm Vật Tư Mới' : 'Chỉnh Sửa Vật Tư'}
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              {mode === 'create' 
                ? 'Thêm vật tư mới vào kho'
                : 'Cập nhật thông tin vật tư'
              }
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Thông Tin Cơ Bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Tên Vật Tư *
                </label>
                <Input
                  placeholder="VD: Khẩu trang y tế 3 lớp"
                  {...form.register('supplyName')}
                />
                {form.formState.errors.supplyName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.supplyName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Đơn Vị *
                </label>
                <Select onValueChange={(value) => form.setValue('unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SupplyUnit).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.unit && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Số Lượng Trong Kho *
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  {...form.register('quantityInStock')}
                />
                {form.formState.errors.quantityInStock && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.quantityInStock.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Hạn Sử Dụng *
                </label>
                <Input
                  type="date"
                  {...form.register('expiryDate')}
                />
                {form.formState.errors.expiryDate && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.expiryDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Giá (VNĐ) *
              </label>
              <Input
                placeholder="0"
                onChange={handlePriceChange}
                defaultValue={mode === 'edit' && supply ? formatPrice(supply.Price.toString()) : ''}
              />
              {form.formState.errors.price && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.price.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Nhập giá đơn vị của vật tư
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleGoBack} className="order-2 sm:order-1">
            <X className="h-4 w-4 mr-2" />
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading} className="order-1 sm:order-2">
            <Save className="h-4 w-4 mr-2" />
            {isLoading 
              ? (mode === 'create' ? 'Đang tạo...' : 'Đang cập nhật...') 
              : (mode === 'create' ? 'Tạo Vật Tư' : 'Cập Nhật')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};