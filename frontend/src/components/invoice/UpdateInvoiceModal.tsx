import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button2";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { formatCurrency, handleCurrencyInput, parseCurrency } from "@/utils/currencyUtils";
import { toast } from "react-toastify";
import type { Invoice } from "@/types/invoice";
import { ConfirmModal } from "../ui/ConfirmModal";

interface UpdateInvoiceFormData {
  invoiceId: number;
  patientId: number;
  paymentMethod: string;
  transactionType: string;
  status: string;
  description: string;
  paidAmount: number;
}

interface UpdateInvoiceModalProps {
  updateOpen: boolean;
  setUpdateOpen: (open: boolean) => void;
  invoice: Invoice | null;
  onUpdateInvoice: (data: UpdateInvoiceFormData) => Promise<void>;
  isUpdating?: boolean;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "PayOS", label: "Chuyển khoản" },
] as const;

const TRANSACTION_TYPES = [
  { value: "full", label: "Toàn bộ" },
  { value: "partial", label: "Một phần" },
] as const;

const INVOICE_STATUSES = [
  { value: "pending", label: "Chờ thanh toán" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "overdue", label: "Quá hạn" },
] as const;

export const UpdateInvoiceModal: React.FC<UpdateInvoiceModalProps> = ({
  updateOpen,
  setUpdateOpen,
  invoice,
  onUpdateInvoice,
  isUpdating = false,
}) => {
  const [formData, setFormData] = React.useState<UpdateInvoiceFormData>({
    invoiceId: 0,
    patientId: 0,
    paymentMethod: "",
    transactionType: "",
    status: "",
    description: "",
    paidAmount: 0,
  });

  const [formattedAmount, setFormattedAmount] = React.useState<string>('');
  const [showConfirm, setShowConfirm] = React.useState(false);

  React.useEffect(() => {
    if (invoice && updateOpen) {
      const initialData: UpdateInvoiceFormData = {
        invoiceId: invoice.invoiceId,
        patientId: invoice.patientId,
        paymentMethod: invoice.paymentMethod,
        transactionType: invoice.transactionType,
        status: invoice.status,
        description: invoice.description || "",
        paidAmount: invoice.paidAmount || 0,
      };

      setFormData(initialData);
      setFormattedAmount(invoice.paidAmount ? formatCurrency(invoice.paidAmount) : '');
    }
  }, [invoice, updateOpen]);

  React.useEffect(() => {
    if (!updateOpen) {
      setFormData({
        invoiceId: 0,
        patientId: 0,
        paymentMethod: "",
        transactionType: "",
        status: "",
        description: "",
        paidAmount: 0,
      });
      setFormattedAmount('');
      setShowConfirm(false);
    }
  }, [updateOpen]);

  const isFormValid = () => {
    return (
      formData.paymentMethod &&
      formData.transactionType &&
      formData.status &&
      formData.paidAmount >= 0 &&
      (invoice ? formData.paidAmount <= invoice.totalAmount : true)
    );
  };

  const handleFieldChange = (field: keyof UpdateInvoiceFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmountChange = (value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      setFormattedAmount(formattedValue);
      const numericValue = parseCurrency(formattedValue);
      if (numericValue >= 0 && invoice && numericValue <= invoice.totalAmount) {
        handleFieldChange('paidAmount', numericValue);
      }
    });
  };

  const handleTransactionTypeChange = (value: string) => {
    handleFieldChange('transactionType', value);
    if (value === 'full' && invoice) {
      handleFieldChange('paidAmount', invoice.totalAmount);
      setFormattedAmount(formatCurrency(invoice.totalAmount));
    } else if (value === 'partial' && formData.paidAmount === invoice?.totalAmount) {
      handleFieldChange('paidAmount', 0);
      setFormattedAmount('');
    }
  };

  const proceedUpdateInvoice = async () => {
    try {
      await onUpdateInvoice(formData);
      setUpdateOpen(false);
      // Removed duplicate toast - success message is handled by parent component
    } catch (error: any) {
      // Only show error toast here since parent component doesn't handle errors in UI
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi cập nhật hóa đơn';
      toast.error(errorMessage);
    }
  };

  if (!invoice) return null;

  const remainingAmount = invoice.totalAmount - formData.paidAmount;
  const canEdit = invoice.status !== 'paid';

  return (
    <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật hóa đơn - {invoice.patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="border p-4 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin hóa đơn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-gray-700">Mã hóa đơn:</p>
                <p className="text-gray-600">{invoice.invoiceId}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Mã đơn hàng:</p>
                <p className="text-gray-600">{invoice.orderCode || 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Tổng tiền:</p>
                <p className="text-gray-900 font-semibold">{formatCurrency(invoice.totalAmount)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-700">Ngày tạo:</p>
                <p className="text-gray-600">
                  {new Date(invoice.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
          </div>

          {!canEdit && (
            <div className="border p-4 rounded-lg bg-red-50 border-red-200">
              <p className="text-red-700 font-medium">
                ⚠️ Hóa đơn đã được thanh toán không thể chỉnh sửa
              </p>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleFieldChange('paymentMethod', value)}
                  disabled={!canEdit || isUpdating}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Chọn phương thức thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="transactionType">Loại giao dịch *</Label>
                <Select
                  value={formData.transactionType}
                  onValueChange={handleTransactionTypeChange}
                  disabled={!canEdit || isUpdating}
                >
                  <SelectTrigger id="transactionType">
                    <SelectValue placeholder="Chọn loại thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Trạng thái *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleFieldChange('status', value)}
                disabled={!canEdit || isUpdating}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paidAmount">Số tiền thanh toán *</Label>
              <div className="mt-1 relative">
                <Input
                  id="paidAmount"
                  type="text"
                  value={formattedAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="Nhập số tiền thanh toán"
                  disabled={!canEdit || isUpdating}
                  className={`pr-12 ${formData.paidAmount > invoice.totalAmount ? 'border-red-500' : ''
                    }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">đ</span>
                </div>
              </div>
              {formData.paidAmount > 0 && (
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-gray-600">
                    Số tiền thanh toán: <span className="font-semibold">{formatCurrency(formData.paidAmount)}</span>
                  </p>
                  {remainingAmount > 0 && (
                    <p className="text-orange-600">
                      Số tiền còn lại: <span className="font-semibold">{formatCurrency(remainingAmount)}</span>
                    </p>
                  )}
                  {remainingAmount === 0 && (
                    <p className="text-green-600 font-semibold">✓ Đã thanh toán đủ</p>
                  )}
                </div>
              )}
              {formData.paidAmount > invoice.totalAmount && (
                <p className="text-red-600 text-sm mt-1">
                  Số tiền thanh toán không được vượt quá tổng tiền điều trị
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Ghi chú</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Nhập ghi chú cho hóa đơn (không bắt buộc)"
                rows={3}
                disabled={!canEdit || isUpdating}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setUpdateOpen(false)} disabled={isUpdating}>
              Hủy
            </Button>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!canEdit || !isFormValid() || isUpdating}
              className="min-w-[100px]"
            >
              {isUpdating ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </div>

        <ConfirmModal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            proceedUpdateInvoice();
          }}
          title="Xác nhận cập nhật hóa đơn"
          message="Bạn có chắc chắn muốn cập nhật thông tin hóa đơn này không? Hành động này sẽ ghi đè dữ liệu cũ."
          confirmText="Cập nhật"
          confirmVariant="destructive"
          isLoading={isUpdating}
        />
      </DialogContent>
    </Dialog>
  );
};