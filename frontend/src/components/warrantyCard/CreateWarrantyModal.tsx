import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"
import type { CreateWarrantyCard } from "@/types/warranty"
import type { TreatmentRecord } from "@/types/treatment"

interface CreateWarrantyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: CreateWarrantyCard
  onFormChange: (form: CreateWarrantyCard) => void
  errors: { [key: string]: string }
  onErrorChange: (errors: { [key: string]: string }) => void
  availableRecords: TreatmentRecord[]
  onSubmit: () => void
}

export function CreateWarrantyDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  errors,
  onErrorChange,
  availableRecords,
  onSubmit,
}: CreateWarrantyDialogProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Tạo thẻ bảo hành mới
          </DialogTitle>
          <DialogDescription>Tạo thẻ bảo hành mới cho một điều trị đã hoàn thành.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label className="pb-1" htmlFor="treatmentRecord">Hồ sơ điều trị *</Label>
            <Select
              value={form.treatmentRecordId.toString()}
              onValueChange={(value) => {
                onFormChange({
                  ...form,
                  treatmentRecordId: Number.parseInt(value) || 0,
                })
                if (errors.treatmentRecordId) {
                  onErrorChange({ ...errors, treatmentRecordId: "" })
                }
              }}
            >
              <SelectTrigger className={errors.treatmentRecordId ? "border-red-500" : ""}>
                <SelectValue placeholder="Chọn hồ sơ điều trị" />
              </SelectTrigger>
              <SelectContent>
                {availableRecords.map((record) => (
                  <SelectItem key={record.treatmentRecordID} value={record.treatmentRecordID.toString()}>
                    <div className="w-full">
                      <div className="font-medium">{record.procedureName}</div>
                      <div className="text-sm text-gray-600">{record.dentistName}</div>
                      <div className="text-sm text-gray-600">{record.toothPosition}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(record.treatmentDate)} • Lịch hẹn #{record.appointmentID}
                      </div>
                      <div className="text-xs font-medium text-green-600">{formatCurrency(record.totalAmount)}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.treatmentRecordId && <p className="text-sm text-red-600 mt-1">{errors.treatmentRecordId}</p>}
            {availableRecords.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Không có hồ sơ điều trị hoàn thành nào để tạo thẻ bảo hành</p>
            )}
          </div>

          <div>
            <Label className="pb-1" htmlFor="duration">Thời hạn (tháng) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="60"
              value={form.duration}
              className={errors.duration ? "border-red-500" : ""}
              onChange={(e) => {
                onFormChange({
                  ...form,
                  duration: Number.parseInt(e.target.value) || 0,
                })
                if (errors.duration) {
                  onErrorChange({ ...errors, duration: "" })
                }
              }}
            />
            {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration}</p>}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            disabled={availableRecords.length === 0}
          >
            Tạo thẻ bảo hành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
