import { useEffect, useState } from "react";
import { X, Plus, Edit3 } from "lucide-react";
import { toast } from "react-toastify";
import type { UseFormReturn } from "react-hook-form";
import type { TreatmentFormData } from "@/types/treatment";
import { useCalculateTotal } from "@/hooks/useCalculateTotal";
import { formatCurrency } from "@/utils/format";
import {
  createTreatmentRecord,
  updateTreatmentRecord,
} from "@/services/treatmentService";

interface TreatmentModalProps {
  formMethods: UseFormReturn<TreatmentFormData>;
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  updatedBy: number;
  recordId?: number;
  appointmentId?: number;
  defaultStatus?: string;
  onSubmit?: (data: TreatmentFormData) => void;
}

const TreatmentModal: React.FC<TreatmentModalProps> = ({
  formMethods,
  isOpen,
  isEditing,
  onClose,
  updatedBy,
  recordId,
  appointmentId,
  defaultStatus,
  onSubmit,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = formMethods;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dentists, setDentists] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const unitPrice = watch("unitPrice") || 0;
  const quantity = watch("quantity") || 0;
  const discountAmount = watch("discountAmount") || 0;
  const discountPercentage = watch("discountPercentage") || 0;
  const totalAmount = useCalculateTotal(unitPrice, quantity, discountAmount, discountPercentage);

  useEffect(() => {
    if (!isEditing) {
      if (appointmentId) {
        setValue("appointmentID", appointmentId);
      }
      if (defaultStatus) {
        setValue("treatmentStatus", defaultStatus);
      }
      setDentists([{ id: 2, name: "Dr. John Doe" }]);
      setProcedures([{ id: 1, name: "Filling" }]);
      setEmployees([
        { id: 1, name: "NVTV Hoàng" },
        { id: 2, name: "NVTV Mai" },
      ]);
    }
  }, [isEditing, appointmentId, defaultStatus, setValue]);

  if (!isOpen) return null;

  const handleInternalSubmit = async (data: TreatmentFormData) => {
    try {
      setIsSubmitting(true);

      const result = isEditing
        ? await updateTreatmentRecord(recordId!, data, totalAmount, updatedBy)
        : await createTreatmentRecord(data, totalAmount, updatedBy);

      toast.success(result.message || (isEditing ? "Cập nhật thành công" : "Tạo mới thành công"));

      if (onSubmit) {
        onSubmit(data);
      }

      onClose();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
      console.error("Lỗi khi gửi dữ liệu:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isEditing ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? "Cập nhật hồ sơ điều trị" : "Thêm hồ sơ điều trị mới"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleInternalSubmit)} className="p-6 space-y-6">
          <fieldset disabled={isSubmitting} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ *</label>
                <select {...register("dentistID", { required: "Bắt buộc", valueAsNumber: true })} className="w-full border rounded-md px-3 py-2">
                  <option value="">Chọn bác sĩ</option>
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thủ thuật *</label>
                <select {...register("procedureID", { required: "Bắt buộc", valueAsNumber: true })} className="w-full border rounded-md px-3 py-2">
                  <option value="">Chọn thủ thuật</option>
                  {procedures.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên tư vấn</label>
                <select {...register("consultantEmployeeID", { valueAsNumber: true })} className="w-full border rounded-md px-3 py-2">
                  <option value="">Chọn nhân viên</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí răng *</label>
                <input
                  {...register("toothPosition", { required: "Bắt buộc" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.toothPosition && <p className="text-sm text-red-500 mt-1">{errors.toothPosition.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày điều trị *</label>
                <input
                  {...register("treatmentDate", { required: "Bắt buộc" })}
                  type="date"
                  min={!isEditing ? new Date().toISOString().split("T")[0] : undefined}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.treatmentDate && <p className="text-sm text-red-500 mt-1">{errors.treatmentDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng *</label>
                <input
                  {...register("quantity", { required: "Bắt buộc", min: 1, valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá *</label>
                <input
                  {...register("unitPrice", { required: "Bắt buộc", min: 0, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
                {errors.unitPrice && <p className="text-sm text-red-500 mt-1">{errors.unitPrice.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trực tiếp</label>
                <input
                  {...register("discountAmount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm (%)</label>
                <input
                  {...register("discountPercentage", { valueAsNumber: true })}
                  type="number"
                  step="0.1"
                  max={100}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md border border-dashed">
              <p className="text-sm font-medium text-gray-700">
                Tổng tạm tính: <span className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái điều trị *</label>
              <select
                {...register("treatmentStatus", { required: "Bắt buộc" })}
                disabled={!isEditing}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
              >
                <option value="">Chọn trạng thái</option>
                <option value="Scheduled">Đã lên lịch</option>
                <option value="In Progress">Đang thực hiện</option>
                <option value="Completed">Đã hoàn tất</option>
                <option value="Cancelled">Đã huỷ</option>
              </select>
              {errors.treatmentStatus && <p className="text-sm text-red-500 mt-1">{errors.treatmentStatus.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng *</label>
              <textarea
                {...register("symptoms", { required: "Bắt buộc" })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.symptoms && <p className="text-sm text-red-500 mt-1">{errors.symptoms.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán *</label>
              <textarea
                {...register("diagnosis", { required: "Bắt buộc" })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
              {errors.diagnosis && <p className="text-sm text-red-500 mt-1">{errors.diagnosis.message}</p>}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isSubmitting ? "Đang gửi..." : isEditing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TreatmentModal;
