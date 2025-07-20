import { useEffect, useState } from "react";
import { X, Plus, Edit3, Clock, Check } from "lucide-react";
import { toast } from "react-toastify";
import type { UseFormReturn } from "react-hook-form";
import type { TreatmentFormData } from "@/types/treatment";
import { useCalculateTotal } from "@/hooks/useCalculateTotal";
import { formatCurrency } from "@/utils/currencyUtils";
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

interface TreatmentRecord {
  id: number;
  procedureName: string;
  dentistName: string;
  toothPosition: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  createdAt: string;
}

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
  keepOpenAfterCreate?: boolean;
  patientId?: number;
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
  keepOpenAfterCreate = true,
  patientId,
}) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = formMethods;

  const { dentists } = useDentistSchedule();
  const [showDentistModal, setShowDentistModal] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdRecords, setCreatedRecords] = useState<TreatmentRecord[]>([]);

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

  // Reset created records when modal opens/closes
  useEffect(() => {
    if (isOpen && !isEditing) {
      setCreatedRecords([]);
    }
  }, [isOpen, isEditing]);

  if (!isOpen) return null;

  const handleInternalSubmit = async (data: TreatmentFormData) => {
    try {
      setIsSubmitting(true);

      if (isEditing) {
        // Editing mode - update and close
        const result: { message?: string } = await updateTreatmentRecord(recordId!, data, totalAmount, updatedBy);
        toast.success(result.message || "Cập nhật thành công");
        if (onSubmit) onSubmit(data);
        formMethods.reset();
        onClose();
      } else {
        // Creating mode - create and stay open
        const result: { message?: string; recordId?: number } = await createTreatmentRecord(
          { ...data },
          totalAmount,
          updatedBy
        );

        // Add to created records history
        const newRecord: TreatmentRecord = {
          id: result.recordId || Date.now(),
          procedureName: selectedProcedure?.procedureName || "Không xác định",
          dentistName: dentists.find(d => String(d.id) === String(selectedDentistId))?.name || "Không xác định",
          toothPosition: data.toothPosition,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalAmount: totalAmount,
          createdAt: new Date().toLocaleString('vi-VN'),
        };

        setCreatedRecords(prev => [...prev, newRecord]);
        toast.success(result.message || "Tạo mới thành công");

        // Reset form for next entry but keep some values
        const dentistId = selectedDentistId;
        const treatmentDate = watch("treatmentDate");
        const appointmentID = watch("appointmentID");
        const treatmentStatus = watch("treatmentStatus");

        reset();

        // Restore some values
        setValue("dentistID", dentistId);
        setValue("treatmentDate", treatmentDate);
        setValue("appointmentID", appointmentID);
        setValue("treatmentStatus", treatmentStatus);

        // Clear procedure selection
        setSelectedProcedure(null);

        // Only call onSubmit if we should close after create
        if (!keepOpenAfterCreate && onSubmit) {
          onSubmit(data);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedRecords([]);
    onClose();
  };

  const handleComplete = () => {
    if (onSubmit && createdRecords.length > 0) {
      onSubmit(formMethods.getValues());
    }
    handleClose();

    if (patientId && patientId > 0) {
      window.location.href = `/patient/view-treatment-records?patientId=${patientId}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            {isEditing ? <Edit3 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {isEditing ? "Cập nhật hồ sơ điều trị" : "Thêm hồ sơ điều trị mới"}
            {!isEditing && createdRecords.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Đã tạo {createdRecords.length} record
              </span>
            )}
          </h3>
          <button onClick={handleClose} title="Đóng" className="text-gray-400 hover:text-gray-600 focus:outline-none">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex">
          {/* Main Form */}
          <div className={`${!isEditing && createdRecords.length > 0 ? 'w-2/3' : 'w-full'} border-r border-gray-200`}>
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
                    {errors.quantity && <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>}
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
                      {...register("discountAmount", { min: { value: 0, message: "Phải lớn hơn bằng 0" }, valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.discountAmount && <p className="text-sm text-red-500 mt-1">{errors.discountAmount.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm (%)</label>
                    <input
                      {...register("discountPercentage", { min: { value: 0, message: "Phải lớn hơn bằng 0" }, valueAsNumber: true })}
                      type="number"
                      step="0.1"
                      max={100}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {errors.discountPercentage && <p className="text-sm text-red-500 mt-1">{errors.discountPercentage.message}</p>}
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
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  {isEditing ? "Huỷ" : "Đóng"}
                </button>

                {/* Show "Hoàn tất" button if we have created records */}
                {!isEditing && createdRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Hoàn tất ({createdRecords.length})
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-md text-white ${isSubmitting ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {isSubmitting ? "Đang gửi..." : isEditing ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>

          {/* History Panel - Only show in create mode */}
          {!isEditing && createdRecords.length > 0 && (
            <div className="w-1/3 p-6 bg-gray-50">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Lịch sử tạo ({createdRecords.length})</h4>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {createdRecords.map((record, index) => (
                  <div key={record.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900">
                        #{createdRecords.length - index}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Thủ thuật:</strong> {record.procedureName}</p>
                      <p><strong>Bác sĩ:</strong> {record.dentistName}</p>
                      <p><strong>Vị trí:</strong> {record.toothPosition}</p>
                      <p><strong>SL:</strong> {record.quantity} | <strong>Đơn giá:</strong> {formatCurrency(record.unitPrice)}</p>
                      <p className="text-green-600 font-semibold">
                        <strong>Tổng:</strong> {formatCurrency(record.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-500">{record.createdAt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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
                    formMethods.handleSubmit((data) =>
                      handleInternalSubmit({ ...data, treatmentToday: true })
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
                    formMethods.handleSubmit((data) =>
                      handleInternalSubmit({ ...data, treatmentToday: false })
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