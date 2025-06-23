import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { CalendarDays, Edit, FileText, Save, User, UserCheck, X } from "lucide-react"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"

export function TreatmentProgressView({ progress }: { progress: TreatmentProgress }) {
  const [editing, setEditing] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TreatmentProgress>({ defaultValues: progress })

  useEffect(() => {
    reset(progress)
  }, [progress, reset])

  const onSubmit = async (values: TreatmentProgress) => {
    console.log("Gửi cập nhật tiến độ:", values)
    setEditing(false)
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Tiến Độ Điều Trị
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center text-sm border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
          >
            <Edit className="w-4 h-4 mr-1" /> Chỉnh Sửa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 border rounded-lg p-4 bg-white">
          <h3 className="font-semibold text-sm text-gray-600">Thông Tin</h3>
          <div className="flex items-center text-sm gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span><strong>Bệnh Nhân</strong>: {progress.patientName}</span>
          </div>
          <div className="flex items-center text-sm gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span><strong>Bác Sĩ</strong>: {progress.dentistName}</span>
          </div>
          <div className="flex items-center text-sm gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span><strong>Hồ Sơ Điều Trị</strong></span>
          </div>
        </div>

        <form className="space-y-4 border rounded-lg p-4 bg-white" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <CalendarDays className="w-4 h-4 ml-4" />
            <span>{formatVietnameseDateFull(new Date(progress.createdAt))}</span>
          </div>

          <div>
            <label className="text-sm font-medium">Nội Dung Tiến Độ:</label>
            <textarea {...register("progressContent")} disabled={!editing} rows={2} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="text-sm font-medium">Mô Tả:</label>
            <textarea {...register("description")} disabled={!editing} rows={2} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="text-sm font-medium">Ghi Chú:</label>
            <textarea {...register("note")} disabled={!editing} rows={2} className="mt-1 w-full border rounded px-3 py-2 text-sm bg-yellow-50 border-yellow-200" />
          </div>

          {editing && (
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-1 text-sm rounded hover:bg-blue-700"
                disabled={isSubmitting}
              >
                <Save className="w-4 h-4 inline mr-1" /> Lưu
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border px-4 py-1 text-sm rounded hover:bg-gray-100"
              >
                <X className="w-4 h-4 inline mr-1" /> Hủy
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 border rounded-lg p-4 bg-white">
        <div><strong>Tạo Lúc:</strong> {formatVietnameseDateFull(new Date(progress.createdAt))}</div>
        <div><strong>Tạo Bởi:</strong>  {progress.createdBy}</div>
        <div><strong>Cập Nhật Lúc:</strong> {progress.updatedAt ? formatVietnameseDateFull(new Date(progress.updatedAt)) : "Chưa"}</div>
        <div><strong>Cập Nhật Bởi:</strong> {progress.updatedBy ? `${progress.updatedBy}` : "Chưa"}</div>
      </div>
    </div>
  )
}