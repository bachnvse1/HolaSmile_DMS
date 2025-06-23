import { X } from "lucide-react"
import type { UseFormReturn } from "react-hook-form"
import type { TreatmentFormData } from "@/types/treatment"
import { useCalculateTotal } from "@/hooks/useCalculateTotal"
import { formatCurrency } from "@/utils/format"

interface TreatmentModalProps {
  formMethods: UseFormReturn<TreatmentFormData>
  isOpen: boolean
  isEditing: boolean
  onClose: () => void
  onSubmit: (data: TreatmentFormData) => void
}

const TreatmentModal: React.FC<TreatmentModalProps> = ({
  formMethods,
  isOpen,
  isEditing,
  onClose,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = formMethods

  const unitPrice = watch("unitPrice") || 0
  const quantity = watch("quantity") || 0
  const discountAmount = watch("discountAmount") || 0
  const discountPercentage = watch("discountPercentage") || 0

  const total = useCalculateTotal(unitPrice, quantity, discountAmount, discountPercentage)

  if (!isOpen) return null

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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã lịch hẹn *</label>
              <input {...register("appointmentID", { required: "Bắt buộc", valueAsNumber: true })} type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.appointmentID && <p className="error">{errors.appointmentID.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ điều trị *</label>
              <select {...register("dentistID", { required: "Bắt buộc", valueAsNumber: true })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Chọn bác sĩ</option>
                <option value={1}>Dr. Smith (ID: 1)</option>
                <option value={2}>Dr. Johnson (ID: 2)</option>
                <option value={3}>Dr. Williams (ID: 3)</option>
              </select>
              {errors.dentistID && <p className="error">{errors.dentistID.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã thủ thuật *</label>
              <input {...register("procedureID", { required: "Bắt buộc", valueAsNumber: true })} type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.procedureID && <p className="error">{errors.procedureID.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí răng *</label>
              <input {...register("toothPosition", { required: "Bắt buộc" })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.toothPosition && <p className="error">{errors.toothPosition.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày điều trị *</label>
              <input {...register("treatmentDate", { required: "Bắt buộc" })} type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.treatmentDate && <p className="error">{errors.treatmentDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
              <input {...register("quantity", { required: "Bắt buộc", min: 1, valueAsNumber: true })} type="number" min={1} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.quantity && <p className="error">{errors.quantity.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá *</label>
              <input {...register("unitPrice", { required: "Bắt buộc", min: 0, valueAsNumber: true })} type="number" step="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.unitPrice && <p className="error">{errors.unitPrice.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trực tiếp</label>
              <input {...register("discountAmount", { valueAsNumber: true })} type="number" step="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giảm (%)</label>
              <input {...register("discountPercentage", { valueAsNumber: true })} type="number" step="0.1" max={100} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm font-medium text-gray-700">
              Tổng tạm tính: <span className="text-lg font-bold text-green-600">{formatCurrency(total)}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên tư vấn *</label>
              <input {...register("consultantEmployeeID", { required: "Bắt buộc", valueAsNumber: true })} type="number" className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              {errors.consultantEmployeeID && <p className="error">{errors.consultantEmployeeID.message}</p>}
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái điều trị *</label>
              <select {...register("treatmentStatus", { required: "Bắt buộc" })} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="">Chọn trạng thái</option>
                <option value="Scheduled">Đã lên lịch</option>
                <option value="In Progress">Đang thực hiện</option>
                <option value="Completed">Đã hoàn tất</option>
                <option value="Cancelled">Đã huỷ</option>
              </select>
              {errors.treatmentStatus && <p className="error">{errors.treatmentStatus.message}</p>}
            </div>
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng *</label>
            <textarea {...register("symptoms", { required: "Bắt buộc" })} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            {errors.symptoms && <p className="error">{errors.symptoms.message}</p>}
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán *</label>
            <textarea {...register("diagnosis", { required: "Bắt buộc" })} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            {errors.diagnosis && <p className="error">{errors.diagnosis.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Huỷ
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {isEditing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TreatmentModal
