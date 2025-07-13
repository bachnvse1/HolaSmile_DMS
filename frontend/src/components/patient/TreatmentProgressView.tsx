import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import {
  CalendarDays,
  Edit,
  FileText,
  Save,
  User,
  UserCheck,
  X,
  CalendarIcon,
} from "lucide-react"
import { format, isValid } from "date-fns"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { updateTreatmentProgress } from "@/services/treatmentProgressService"
import { toast } from "react-toastify"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button2"

const statusOptions = [
  { value: "pending", label: "Đã lên lịch" },
  { value: "in-progress", label: "Đang điều trị" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "canceled", label: "Đã huỷ" },
]

function toVietnamISOString(date: Date): string {
  const offset = date.getTimezoneOffset()
  const localTime = new Date(date.getTime() - offset * 60000)
  return localTime.toISOString()
}

export function TreatmentProgressView({ progress }: { progress: TreatmentProgress }) {
  const [editing, setEditing] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState<string>("")

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TreatmentProgress>({ defaultValues: progress })

  useEffect(() => {
    reset(progress)
    if (progress.endTime) {
      const dt = new Date(progress.endTime)
      setSelectedDate(dt)
      const hh = dt.getHours().toString().padStart(2, "0")
      const mm = dt.getMinutes().toString().padStart(2, "0")
      setSelectedTime(`${hh}:${mm}`)
    }
  }, [progress, reset])

  const onSubmit = async (values: TreatmentProgress) => {
    if (!selectedDate || !selectedTime) {
      toast.error("Vui lòng chọn ngày và giờ kết thúc")
      return
    }

    const [h, m] = selectedTime.split(":").map(Number)
    const combined = new Date(selectedDate)
    combined.setHours(h)
    combined.setMinutes(m)

    values.endTime = toVietnamISOString(combined)

    try {
      const result = await updateTreatmentProgress(values)
      toast.success(result.message || "Cập nhật tiến trình thành công")
      setEditing(false)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Lỗi khi cập nhật tiến trình")
    }
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Tiến Độ Điều Trị
        </h2>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center text-sm border border-gray-300 rounded px-3 py-1 hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-1" /> Chỉnh Sửa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột trái: Thông tin */}
        <div className="space-y-3 border rounded-lg p-4 bg-white shadow-sm">
          <h3 className="font-semibold text-sm text-gray-600">Thông Tin</h3>

          <div className="flex items-center text-sm gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span><strong>Bệnh Nhân:</strong> {progress.patientName}</span>
          </div>

          <div className="flex items-center text-sm gap-2">
            <UserCheck className="w-4 h-4 text-green-600" />
            <span><strong>Bác Sĩ:</strong> {progress.dentistName}</span>
          </div>

          <div className="flex items-center text-sm gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            <span><strong>Hồ Sơ Điều Trị:</strong> #{progress.treatmentRecordID}</span>
          </div>
        </div>

        {/* Cột phải: Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border rounded-lg p-4 bg-white shadow-sm">
          <div>
            <label className="text-sm font-medium">Tên Tiến Trình</label>
            <Input {...register("progressName")} disabled={!editing} />
          </div>

          <div>
            <label className="text-sm font-medium">Nội Dung</label>
            <textarea {...register("progressContent")} disabled={!editing} rows={editing ? 2 : 1}
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="text-sm font-medium">Trạng Thái</label>
            {editing ? (
              <select {...register("status")} className="w-full border rounded px-3 py-2 text-sm">
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <Input value={statusOptions.find(x => x.value === progress.status)?.label || progress.status} disabled />
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Thời Lượng (phút)</label>
            <Input type="number" {...register("duration")} disabled={!editing} />
          </div>

          <div>
            <label className="text-sm font-medium">Mô Tả</label>
            <textarea {...register("description")} disabled={!editing} rows={editing ? 2 : 1}
              className="w-full border rounded px-3 py-2 text-sm bg-gray-50" />
          </div>

          <div>
            <label className="text-sm font-medium">Thời Gian Kết Thúc</label>
            {editing ? (
              <div className="grid grid-cols-1 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start w-full text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
              </div>
            ) : (
              <Input
                disabled
                value={
                  progress.endTime && isValid(new Date(progress.endTime))
                    ? format(new Date(progress.endTime), "dd/MM/yyyy HH:mm")
                    : ""
                }
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Ghi Chú</label>
            <textarea {...register("note")} disabled={!editing} rows={editing ? 2 : 1}
              className="w-full border rounded px-3 py-2 text-sm bg-yellow-50 border-yellow-200" />
          </div>

          {editing && (
            <div className="flex gap-2 justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-1" /> Lưu
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" /> Hủy
              </Button>
            </div>
          )}
        </form>

        {/* Block thời gian riêng */}
        {!editing && (
          <div className="border rounded-lg bg-white shadow-sm p-4 space-y-2 text-sm text-gray-700 md:col-span-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-500" />
              <span>
                <strong>Tạo lúc:</strong> {formatVietnameseDateFull(new Date(progress.createdAt || ""))}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              <span>
                <strong>Tạo bởi:</strong> {progress.createdBy ?? "Không rõ"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span>
                <strong>Cập nhật lúc:</strong>{" "}
                {progress.updatedAt ? formatVietnameseDateFull(new Date(progress.updatedAt)) : "Chưa cập nhật"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-500" />
              <span>
                <strong>Cập nhật bởi:</strong> {progress.updatedBy ?? "Chưa"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
