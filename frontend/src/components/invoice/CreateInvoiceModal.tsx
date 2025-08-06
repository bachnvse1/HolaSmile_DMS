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

// Improved type definitions
interface TreatmentRecord {
  symptoms: string;
  totalAmount: number;
  treatmentDate: string;
}

interface InvoiceFormData {
  patientId: number;
  treatmentRecordId: number;
  paymentMethod: string;
  transactionType: string;
  description: string;
  paidAmount: number;
}

interface CreateInvoiceModalProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  newInvoice: InvoiceFormData;
  setNewInvoice: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  patientName: string;
  treatmentRecord: TreatmentRecord;
  handleCreateInvoice: () => void;
  isCreating?: boolean; 
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Tiền mặt" },
  { value: "PayOS", label: "Chuyển khoản" },
] as const;

const TRANSACTION_TYPES = [
  { value: "full", label: "Toàn bộ" },
  { value: "partial", label: "Một phần" },
] as const;

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  createOpen,
  setCreateOpen,
  newInvoice,
  setNewInvoice,
  patientName,
  treatmentRecord,
  handleCreateInvoice,
  isCreating = false,
}) => {
  const [formattedAmount, setFormattedAmount] = React.useState<string>('');

  React.useEffect(() => {
    if (newInvoice.paidAmount > 0) {
      setFormattedAmount(formatCurrency(newInvoice.paidAmount));
    } else {
      setFormattedAmount('');
    }
  }, [newInvoice.paidAmount]);

  const isFormValid = () => {
    return (
      newInvoice.paymentMethod &&
      newInvoice.transactionType &&
      newInvoice.paidAmount > 0 &&
      newInvoice.paidAmount <= treatmentRecord.totalAmount
    );
  };

  const handleFieldChange = (field: keyof InvoiceFormData, value: string | number) => {
    setNewInvoice(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmountChange = (value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      setFormattedAmount(formattedValue);
      const numericValue = parseCurrency(formattedValue);
      if (numericValue >= 0 && numericValue <= treatmentRecord.totalAmount) {
        handleFieldChange('paidAmount', numericValue);
      }
    });
  };

  const handleTransactionTypeChange = (value: string) => {
    handleFieldChange('transactionType', value);
    if (value === 'full') {
      handleFieldChange('paidAmount', treatmentRecord.totalAmount);
      setFormattedAmount(formatCurrency(treatmentRecord.totalAmount));
    } else if (value === 'partial' && newInvoice.paidAmount === treatmentRecord.totalAmount) {
      handleFieldChange('paidAmount', 0);
      setFormattedAmount('');
    }
  };

 const handleCreateInvoiceWithNavigation = async () => {
    try {
      await handleCreateInvoice();
      setTimeout(() => {
        window.location.href = '/invoices';
      }, 1000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi khi tạo hóa đơn';
      toast.error(errorMessage);
    }
  };

  // Calculate remaining amount
  const remainingAmount = treatmentRecord.totalAmount - newInvoice.paidAmount;

  return (
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo hóa đơn cho {patientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Treatment Summary */}
          <div className="border p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin điều trị</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <div>
                  <p className="font-medium text-gray-700">Triệu chứng:</p>
                  <p className="text-gray-600">{treatmentRecord.symptoms}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div>
                  <p className="font-medium text-gray-700">Tổng tiền:</p>
                  <p className="text-gray-900 font-semibold">{formatCurrency(treatmentRecord.totalAmount)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div>
                  <p className="font-medium text-gray-700">Ngày điều trị:</p>
                  <p className="text-gray-600">{treatmentRecord.treatmentDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                Phương thức thanh toán *
              </Label>
              <Select
                value={newInvoice.paymentMethod}
                onValueChange={(value) => handleFieldChange('paymentMethod', value)}
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
              <Label htmlFor="transactionType" className="text-sm font-medium">
                Loại giao dịch *
              </Label>
              <Select
                value={newInvoice.transactionType}
                onValueChange={handleTransactionTypeChange}
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

          {/* Payment Amount */}
          <div>
            <Label htmlFor="paidAmount" className="text-sm font-medium">
              Số tiền thanh toán *
            </Label>
            <div className="mt-1 relative">
              <Input
                id="paidAmount"
                type="text"
                value={formattedAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Nhập số tiền thanh toán"
                className={`pr-12 ${
                  newInvoice.paidAmount > treatmentRecord.totalAmount 
                    ? 'border-red-500 focus:border-red-500' 
                    : ''
                }`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">đ</span>
              </div>
            </div>
            {newInvoice.paidAmount > 0 && (
              <div className="mt-2 text-sm space-y-1">
                <p className="text-gray-600">
                  Số tiền thanh toán: <span className="font-semibold">{formatCurrency(newInvoice.paidAmount)}</span>
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
            {newInvoice.paidAmount > treatmentRecord.totalAmount && (
              <p className="text-red-600 text-sm mt-1">
                Số tiền thanh toán không được vượt quá tổng tiền điều trị
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Ghi chú
            </Label>
            <Textarea
              id="description"
              value={newInvoice.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Nhập ghi chú cho hóa đơn (không bắt buộc)"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button
              onClick={handleCreateInvoiceWithNavigation}
              disabled={!isFormValid() || isCreating}
              className="min-w-[100px]"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang tạo...
                </>
              ) : (
                'Tạo hóa đơn'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};