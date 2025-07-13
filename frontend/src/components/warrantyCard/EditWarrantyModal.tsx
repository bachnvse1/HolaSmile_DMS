import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Edit, CheckCircle2, AlertCircle } from "lucide-react"
import type { EditWarrantyCard, WarrantyCard } from "@/types/warranty" 

interface EditWarrantyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: EditWarrantyCard
  onFormChange: (form: EditWarrantyCard) => void
  errors: { [key: string]: string }
  onErrorChange: (errors: { [key: string]: string }) => void
  editingCard: WarrantyCard | null
  onSubmit: () => void
}

export function EditWarrantyDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  errors,
  onErrorChange,
  editingCard,
  onSubmit,
}: EditWarrantyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Chỉnh sửa thẻ bảo hành
          </DialogTitle>
          <DialogDescription>Cập nhật thông tin thẻ bảo hành cho {editingCard?.patientName}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <Label htmlFor="editDuration">Thời hạn (tháng) *</Label>
            <Input
              id="editDuration"
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

          <div>
            <Label className="text-base font-medium">Trạng thái thẻ bảo hành</Label>
            <div className="mt-3 space-y-3">
              {/* Active Option */}
              <Card
                className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
                  form.status
                    ? "border-green-500 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => onFormChange({ ...form, status: true })}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      form.status ? "border-green-500 bg-green-500" : "border-gray-300"
                    }`}
                  >
                    {form.status && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className={`w-5 h-5 ${form.status ? "text-green-600" : "text-gray-400"}`} />
                    <div>
                      <div className={`font-medium ${form.status ? "text-green-900" : "text-gray-700"}`}>Hoạt động</div>
                      <div className={`text-sm ${form.status ? "text-green-700" : "text-gray-500"}`}>
                        Thẻ bảo hành có hiệu lực và có thể sử dụng
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Inactive Option */}
              <Card
                className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
                  !form.status ? "border-red-500 bg-red-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                }`}
                onClick={() => onFormChange({ ...form, status: false })}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      !form.status ? "border-red-500 bg-red-500" : "border-gray-300"
                    }`}
                  >
                    {!form.status && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className={`w-5 h-5 ${!form.status ? "text-red-600" : "text-gray-400"}`} />
                    <div>
                      <div className={`font-medium ${!form.status ? "text-red-900" : "text-gray-700"}`}>
                        Không hoạt động
                      </div>
                      <div className={`text-sm ${!form.status ? "text-red-700" : "text-gray-500"}`}>
                        Thẻ bảo hành bị vô hiệu hóa và không thể sử dụng
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Hủy
          </Button>
          <Button onClick={onSubmit} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
