import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateReceipt, useCreatePayment } from '@/hooks/useFinancialTransactions';
import { formatCurrency, handleCurrencyInput } from '@/utils/currencyUtils';
import { toast } from 'react-toastify';
import { getErrorMessage } from '@/utils/formatUtils';

interface CreateTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'receipt' | 'payment';
}

interface FormData {
  description: string;
  category: string;
  amount: string;
  paymentMethod: string;
}

export const CreateTransactionModal: React.FC<CreateTransactionModalProps> = ({
  isOpen,
  onClose,
  type
}) => {
  const form = useForm<FormData>({
    defaultValues: {
      description: '',
      category: '',
      amount: '',
      paymentMethod: 'cash'
    }
  });

  const createReceiptMutation = useCreateReceipt();
  const createPaymentMutation = useCreatePayment();

  const mutation = type === 'receipt' ? createReceiptMutation : createPaymentMutation;

  const handleAmountChange = (value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      form.setValue('amount', formattedValue);
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      // Convert amount to number (remove formatting)
      const numericAmount = parseInt(data.amount.replace(/[^\d]/g, '')) || 0;
      
      const requestData = {
        description: data.description,
        transactionType: type === 'receipt', // true for receipt, false for payment
        category: data.category,
        paymentMethod: data.paymentMethod === 'cash', // true for cash, false for transfer
        amount: numericAmount
      };

      await mutation.mutateAsync(requestData);
      
      toast.success(`Đã tạo ${type === 'receipt' ? 'phiếu thu' : 'phiếu chi'} thành công`);
      form.reset();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error) || `Có lỗi xảy ra khi tạo ${type === 'receipt' ? 'phiếu thu' : 'phiếu chi'}`);
    }
  };

  if (!isOpen) return null;

  const title = type === 'receipt' ? 'Tạo Phiếu Thu' : 'Tạo Phiếu Chi';
  const submitText = type === 'receipt' ? 'Tạo Phiếu Thu' : 'Tạo Phiếu Chi';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              placeholder={`Nhập mô tả cho ${type === 'receipt' ? 'phiếu thu' : 'phiếu chi'}...`}
              {...form.register('description', { required: 'Vui lòng nhập mô tả' })}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Danh mục *</Label>
            <Select onValueChange={(value) => form.setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                {type === 'receipt' ? (
                  <>
                    <SelectItem value="Dịch vụ nha khoa">Dịch vụ nha khoa</SelectItem>
                    <SelectItem value="Điều trị">Điều trị</SelectItem>
                    <SelectItem value="Tư vấn">Tư vấn</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="Vật tư y tế">Vật tư y tế</SelectItem>
                    <SelectItem value="Thiết bị">Thiết bị</SelectItem>
                    <SelectItem value="Thuốc men">Thuốc men</SelectItem>
                    <SelectItem value="Chi phí vận hành">Chi phí vận hành</SelectItem>
                    <SelectItem value="Lương nhân viên">Lương nhân viên</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.category && (
              <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Số tiền *</Label>
            <div className="relative">
              <Input
                id="amount"
                placeholder="0"
                value={form.watch('amount')}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₫</span>
            </div>
            {form.formState.errors.amount && (
              <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
            <Select onValueChange={(value) => form.setValue('paymentMethod', value)} defaultValue="cash">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Tiền mặt</SelectItem>
                <SelectItem value="transfer">Chuyển khoản</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {form.watch('amount') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Xem trước:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Loại:</span>
                  <span className={type === 'receipt' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {type === 'receipt' ? 'Thu' : 'Chi'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Số tiền:</span>
                  <span className="font-medium">
                    {formatCurrency(parseInt(form.watch('amount').replace(/[^\d]/g, '')) || 0)} ₫
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className={type === 'receipt' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {mutation.isPending ? 'Đang tạo...' : submitText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};