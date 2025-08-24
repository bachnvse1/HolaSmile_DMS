import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button2";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency, handleCurrencyInput, parseCurrency } from "@/utils/currencyUtils";

interface TreatmentRecord {
  symptoms: string;
  totalAmount: number;
  treatmentDate: string;
  remainingAmount: number | null | undefined;
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
  handleCreateInvoice: () => Promise<void>;
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
  const [formattedAmount, setFormattedAmount] = React.useState<string>("");

  const remainingCap = treatmentRecord.remainingAmount ?? 0;
  const isAmountExceeded = newInvoice.paidAmount > remainingCap;
  
  const canPayFull = remainingCap >= treatmentRecord.totalAmount;
  
  const availableTransactionTypes = TRANSACTION_TYPES.filter(type => 
    canPayFull || type.value !== "full"
  );

  React.useEffect(() => {
    if (newInvoice.paidAmount > 0) setFormattedAmount(formatCurrency(newInvoice.paidAmount));
    else setFormattedAmount("");
  }, [newInvoice.paidAmount]);

  const handleFieldChange = (field: keyof InvoiceFormData, value: string | number) => {
    setNewInvoice(prev => ({ ...prev, [field]: value }));
  };

  const handleAmountChange = (value: string) => {
    handleCurrencyInput(value, (formattedValue) => {
      setFormattedAmount(formattedValue);
      const n = parseCurrency(formattedValue);
      if (n >= 0) handleFieldChange("paidAmount", n);
    });
  };

  const handleTransactionTypeChange = (value: string) => {
    handleFieldChange("transactionType", value);
    if (value === "full") {
      handleFieldChange("paidAmount", remainingCap);
      setFormattedAmount(formatCurrency(remainingCap));
    } else if (value === "partial" && newInvoice.paidAmount === remainingCap) {
      handleFieldChange("paidAmount", 0);
      setFormattedAmount("");
    }
  };

  const handleCreateInvoiceClick = async () => {
    await handleCreateInvoice();
  };

  const remainingDisplay = Math.max(remainingCap - newInvoice.paidAmount, 0);

  const isFormValid = () =>
    newInvoice.paymentMethod &&
    newInvoice.transactionType &&
    newInvoice.paidAmount > 0 &&
    !isAmountExceeded;

  return (
    <Dialog open={createOpen} onOpenChange={(open) => { if (!isCreating) setCreateOpen(open); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Tạo hóa đơn cho {patientName}</DialogTitle></DialogHeader>

        <div className="space-y-6">
          <div className="border p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin điều trị</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><p className="font-medium text-gray-700">Triệu chứng:</p><p className="text-gray-600">{treatmentRecord.symptoms}</p></div>
              <div><p className="font-medium text-gray-700">Tổng tiền:</p><p className="text-gray-900 font-semibold">{formatCurrency(treatmentRecord.totalAmount)}</p></div>
              <div><p className="font-medium text-gray-700">Ngày điều trị:</p><p className="text-gray-600">{treatmentRecord.treatmentDate}</p></div>
              <div><p className="font-medium text-gray-700">Số tiền còn lại:</p><p className="text-orange-600 font-semibold">{formatCurrency(remainingCap)}</p></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
              <Select value={newInvoice.paymentMethod} onValueChange={(v) => handleFieldChange("paymentMethod", v)} disabled={isCreating}>
                <SelectTrigger id="paymentMethod"><SelectValue placeholder="Chọn phương thức thanh toán" /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="transactionType">Loại giao dịch *</Label>
              <Select value={newInvoice.transactionType} onValueChange={handleTransactionTypeChange} disabled={isCreating}>
                <SelectTrigger id="transactionType"><SelectValue placeholder="Chọn loại thanh toán" /></SelectTrigger>
                <SelectContent>{availableTransactionTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
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
                disabled={isCreating}
                className={`pr-12 ${isAmountExceeded ? "border-red-500 focus:border-red-500" : ""}`}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 text-sm">đ</span></div>
            </div>

            {newInvoice.paidAmount > 0 && !isAmountExceeded && (
              <div className="mt-2 text-sm space-y-1">
                <p className="text-gray-600">Số tiền thanh toán: <span className="font-semibold">{formatCurrency(newInvoice.paidAmount)}</span></p>
                {remainingDisplay > 0 && <p className="text-orange-600">Số tiền còn lại: <span className="font-semibold">{formatCurrency(remainingDisplay)}</span></p>}
                {remainingDisplay === 0 && <p className="text-green-600 font-semibold">Đã thanh toán đủ</p>}
              </div>
            )}

            {isAmountExceeded && (
              <div className="mt-2 text-sm space-y-1">
                <p className="text-red-600 font-semibold">Số tiền thanh toán không được vượt quá số tiền chưa thanh toán</p>
                <p className="text-gray-600">Số tiền tối đa: <span className="font-semibold text-orange-600">{formatCurrency(remainingCap)}</span></p>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="description">Ghi chú</Label>
            <Textarea id="description" value={newInvoice.description} onChange={(e) => handleFieldChange("description", e.target.value)} placeholder="Nhập ghi chú cho hóa đơn (không bắt buộc)" rows={3} disabled={isCreating} className="mt-1" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>Hủy</Button>
            <Button onClick={handleCreateInvoiceClick} disabled={!isFormValid() || isCreating} className="min-w-[100px]">
              {isCreating ? "Đang tạo..." : "Tạo hóa đơn"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};