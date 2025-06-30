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
import { SelectDentistModal } from "./SelectDentistModal";
import { useDentistSchedule } from "@/hooks/useDentistSchedule";
import { ProcedureSelectionModal } from "./ProcedureSelectionModal";
import type { Procedure } from "@/types/procedure";
import { SHIFT_TIME_MAP } from "@/utils/schedule";
import { parseLocalDate } from "@/utils/dateUtils";

interface TreatmentModalProps {
  formMethods: UseFormReturn<TreatmentFormData>;
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  updatedBy: number;
  recordId?: number;
  appointmentId?: number;
  defaultStatus?: string;
  treatmentToday?: boolean;
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
    formState: { errors },
    watch,
    setValue,
  } = formMethods;

  const { dentists } = useDentistSchedule();
  const [showDentistModal, setShowDentistModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [treatmentTodayState, setTreatmentTodayState] = useState<boolean | undefined>(undefined);

  const selectedDentistId = watch("dentistID");
  const unitPrice = watch("unitPrice") || 0;
  const quantity = watch("quantity") || 0;
  const discountAmount = watch("discountAmount") || 0;
  const discountPercentage = watch("discountPercentage") || 0;
  const totalAmount = useCalculateTotal(unitPrice, quantity, discountAmount, discountPercentage);

  useEffect(() => {
    if (!isEditing) {
      if (appointmentId) setValue("appointmentID", appointmentId);
      if (defaultStatus) setValue("treatmentStatus", defaultStatus);
    }
  }, [isEditing, appointmentId, defaultStatus, setValue]);

  if (!isOpen) return null;

  const handleInternalSubmit = async (data: TreatmentFormData) => {
    try {
      setIsSubmitting(true);
      const result: { message?: string } = isEditing
        ? await updateTreatmentRecord(recordId!, data, totalAmount, updatedBy)
        : await createTreatmentRecord(
          { ...data, treatmentToday: treatmentTodayState },
          totalAmount,
          updatedBy
        );

      toast.success(result.message || (isEditing ? "Cập nhật thành công" : "Tạo mới thành công"));
      if (onSubmit) onSubmit(data);
      formMethods.reset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEditing) setShowConfirm(true);
            else formMethods.handleSubmit(handleInternalSubmit)();
          }}
          className="p-6 space-y-6"
        >
          <fieldset disabled={isSubmitting} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ *</label>
                <button
                  type="button"
                  onClick={() => setShowDentistModal(true)}
                  className="w-full border rounded-md px-3 py-2 bg-gray-50 text-left"
                >
                  {selectedDentistId
                    ? `${dentists.find((d) => String(d.id) === String(selectedDentistId))?.name || "Không xác định"}`
                    : "Chọn bác sĩ"}
                </button>
                {errors.dentistID && (
                  <p className="text-sm text-red-500 mt-1">{errors.dentistID.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thủ thuật *</label>
                <ProcedureSelectionModal
                  selectedProcedure={selectedProcedure}
                  onProcedureChange={(procedure) => {
                    if (procedure) {
                      setSelectedProcedure(procedure);
                      setValue("procedureID", procedure.procedureId, { shouldValidate: true });
                      setValue("unitPrice", procedure.price, { shouldValidate: true });
                      toast.success(`Đã chọn thủ thuật: ${procedure.procedureName}`);
                    }
                  }}
                  trigger={
                    <button
                      type="button"
                      className="w-full border rounded-md px-3 py-2 bg-gray-50 text-left"
                    >
                      {selectedProcedure
                        ? `${selectedProcedure.procedureName}`
                        : "Chọn thủ thuật"}
                    </button>
                  }
                />
                {errors.procedureID && (
                  <p className="text-sm text-red-500 mt-1">{errors.procedureID.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vị trí răng *</label>
                <input
                  {...register("toothPosition", { required: "Bắt buộc" })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày điều trị *</label>
                <input
                  {...register("treatmentDate", { required: "Bắt buộc" })}
                  type="text"
                  disabled
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá *</label>
                <input
                  {...register("unitPrice", { required: "Bắt buộc", min: 0, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm trực tiếp</label>
                <input
                  {...register("discountAmount", {min: { value: 1, message: "Phải lớn hơn 0" }, valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảm (%)</label>
                <input
                  {...register("discountPercentage", {min: { value: 1, message: "Phải lớn hơn 0" }, valueAsNumber: true })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Triệu chứng *</label>
              <textarea
                {...register("symptoms", { required: "Bắt buộc" })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chẩn đoán *</label>
              <textarea
                {...register("diagnosis", { required: "Bắt buộc" })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
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
              className={`px-4 py-2 rounded-md text-white ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Đang gửi..." : isEditing ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>

        {/* Confirm Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Tạo lịch điều trị</h2>
              <p className="mb-6">
                Bạn có muốn tạo lịch điều trị dựa trên ngày được chọn từ lịch nha sĩ không?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setTreatmentTodayState(false);
                    formMethods.handleSubmit((data) =>
                      handleInternalSubmit({ ...data, treatmentToday: false })
                    )();
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Không
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setTreatmentTodayState(true);
                    formMethods.handleSubmit((data) =>
                      handleInternalSubmit({ ...data, treatmentToday: true })
                    )();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Có
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chọn bác sĩ */}
        <SelectDentistModal
          isOpen={showDentistModal}
          onClose={() => setShowDentistModal(false)}
          dentists={dentists}
          selectedDentist={
            selectedDentistId
              ? dentists.find((d) => String(d.id) === String(selectedDentistId)) || null
              : null
          }
          onConfirm={(dentist, date, slot) => {
            try {
              const time = SHIFT_TIME_MAP[slot as keyof typeof SHIFT_TIME_MAP];
              const isoLike = `${date}T${time}:00`;
              const parsed = parseLocalDate(isoLike);

              if (!parsed || isNaN(parsed.getTime())) {
                toast.error("Thời gian không hợp lệ");
                return;
              }

              setValue("dentistID", Number(dentist.id), { shouldValidate: true });
              setValue("treatmentDate", parsed.toISOString(), { shouldValidate: true });

              toast.success(`Đã chọn ${dentist.name} vào ${date}`);
            } catch (error) {
              console.error("Lỗi xử lý lịch:", error);
              toast.error("Không thể xác định thời gian lịch hẹn.");
            }
          }}
        />
      </div>
    </div>
  );
};

export default TreatmentModal;