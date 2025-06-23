import { useState } from "react"
import { X } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import type { UseFormReturn } from "react-hook-form"
import type { TreatmentFormData } from "@/types/treatment"
import { useCalculateTotal } from "@/hooks/useCalculateTotal"
import { formatCurrency } from "@/utils/format"
import { createOrUpdateTreatmentRecord } from "@/services/treatmentService"

interface TreatmentModalProps {
  formMethods: UseFormReturn<TreatmentFormData>
  isOpen: boolean
  isEditing: boolean
  onClose: () => void
  updatedBy: number
  recordId?: number
  onSubmit?: (data: TreatmentFormData) => void
}

const TreatmentModal: React.FC<TreatmentModalProps> = ({
  formMethods,
  isOpen,
  isEditing,
  onClose,
  updatedBy,
  recordId,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = formMethods

  const [isSubmitting, setIsSubmitting] = useState(false)

  const unitPrice = watch("unitPrice") || 0
  const quantity = watch("quantity") || 0
  const discountAmount = watch("discountAmount") || 0
  const discountPercentage = watch("discountPercentage") || 0
  const totalAmount = useCalculateTotal(unitPrice, quantity, discountAmount, discountPercentage)

  if (!isOpen) return null

  const handleInternalSubmit = async (data: TreatmentFormData) => {
    try {
      setIsSubmitting(true)
      const result = await createOrUpdateTreatmentRecord(
        data,
        totalAmount,
        updatedBy,
        recordId
      )

      toast.success(result.message || "Cập nhật thành công")

      if (onSubmit) {
        onSubmit(data)
      }

      onClose()
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra")
      console.error("Lỗi khi gửi dữ liệu:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Cập nhật hồ sơ điều trị" : "Thêm hồ sơ điều trị mới"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleInternalSubmit)} className="p-6">
          <fieldset disabled={isSubmitting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí răng *</label>
                <input
                  {...register("toothPosition", { required: "Bắt buộc" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.toothPosition && <p className="error">{errors.toothPosition.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày điều trị *</label>
                <input
                  {...register("treatmentDate", { required: "Bắt buộc" })}
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.treatmentDate && <p className="error">{errors.treatmentDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
                <input
                  {...register("quantity", { required: "Bắt buộc", min: 1, valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.quantity && <p className="error">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá *</label>
                <input
                  {...register("unitPrice", { required: "Bắt buộc", min: 0, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {errors.unitPrice && <p className="error">{errors.unitPrice.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trực tiếp</label>
                <input
                  {...register("discountAmount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm (%)</label>
                <input
                  {...register("discountPercentage", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  max={100}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium text-gray-700">
                Tổng tạm tính: <span className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái điều trị *</label>
              <select
                {...register("treatmentStatus", { required: "Bắt buộc" })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Chọn trạng thái</option>
                <option value="Scheduled">Đã lên lịch</option>
                <option value="In Progress">Đang thực hiện</option>
                <option value="Completed">Đã hoàn tất</option>
                <option value="Cancelled">Đã huỷ</option>
              </select>
              {errors.treatmentStatus && <p className="error">{errors.treatmentStatus.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng *</label>
              <textarea
                {...register("symptoms", { required: "Bắt buộc" })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.symptoms && <p className="error">{errors.symptoms.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán *</label>
              <textarea
                {...register("diagnosis", { required: "Bắt buộc" })}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.diagnosis && <p className="error">{errors.diagnosis.message}</p>}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Huỷ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Đang gửi..." : isEditing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}

export default TreatmentModal 