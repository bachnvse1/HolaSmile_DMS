import { useState, useEffect } from "react"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { getTreatmentProgressById } from "@/services/treatmentProgressService"
import {
  Clock, FileText, Edit, Save, X, Loader2,
  CheckCircle, AlertCircle, Pause, XCircle, Calendar, User
} from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { formatVietnameseDateFull, formatVietnameseDateWithDay } from "@/utils/date"

interface Props {
  treatmentProgressID: string
  onUpdate?: (progress: TreatmentProgress) => void
}

const statusConfig = {
  Pending: { label: "Chờ Xử Lý", color: "bg-yellow-100 text-yellow-800 border border-yellow-300", icon: Clock },
  "In Progress": { label: "Đang Thực Hiện", color: "bg-blue-100 text-blue-800 border border-blue-300", icon: Loader2 },
  Completed: { label: "Hoàn Thành", color: "bg-green-100 text-green-800 border border-green-300", icon: CheckCircle },
  Cancelled: { label: "Đã Hủy", color: "bg-red-100 text-red-800 border border-red-300", icon: XCircle },
  "On Hold": { label: "Tạm Dừng", color: "bg-gray-100 text-gray-800 border border-gray-300", icon: Pause }
} as const

export default function TreatmentProgressView({ treatmentProgressID, onUpdate }: Props) {
  const [progress, setProgress] = useState<TreatmentProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editForm, setEditForm] = useState({
    progressName: "",
    progressContent: "",
    status: "",
    duration: 0,
    description: "",
    note: "",
  })

  useEffect(() => {
    fetchProgress()
  }, [treatmentProgressID])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const data = await getTreatmentProgressById(treatmentProgressID)
      setProgress(data)
      setEditForm({
        progressName: data.progressName || "",
        progressContent: data.progressContent || "",
        status: data.status || "",
        duration: data.duration || 0,
        description: data.description || "",
        note: data.note || "",
      })
    } catch (err) {
      toast.error("Không thể tải dữ liệu tiến độ điều trị.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!progress) return
    try {
      setSaving(true)
      console.log("Gửi dữ liệu cập nhật:", editForm)
      toast.success("Tiến độ đã được cập nhật.")
      setEditing(false)
      fetchProgress()
      onUpdate?.({ ...progress, ...editForm })
    } catch {
      toast.error("Không thể cập nhật tiến độ điều trị.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!progress) return
    setEditForm({
      progressName: progress.progressName || "",
      progressContent: progress.progressContent || "",
      status: progress.status || "",
      duration: progress.duration || 0,
      description: progress.description || "",
      note: progress.note || "",
    })
    setEditing(false)
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} phút`
    const hours = Math.floor(minutes / 60)
    const remaining = minutes % 60
    return remaining === 0 ? `${hours} giờ` : `${hours} giờ ${remaining} phút`
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500"><Loader2 className="inline h-5 w-5 animate-spin mr-2" />Đang tải...</div>
  }

  if (!progress) {
    return <div className="p-6 text-center text-red-500"><AlertCircle className="inline h-5 w-5 mr-2" />Không tìm thấy dữ liệu</div>
  }

  const statusKey = (progress.status || "Pending") as keyof typeof statusConfig
  const StatusIcon = statusConfig[statusKey].icon

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Tiến Độ Điều Trị
          </h2>
          <p className="text-sm text-gray-500">ID: {progress.treatmentProgressID}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-sm rounded ${statusConfig[statusKey].color} inline-flex items-center`}>
            <StatusIcon className="h-3 w-3 mr-1" /> {statusConfig[statusKey].label}
          </span>
          {!editing ? (
            <button onClick={() => setEditing(true)} className="text-sm px-3 py-1 border rounded hover:bg-gray-100 inline-flex items-center">
              <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 inline-flex items-center">
                <Save className="h-4 w-4 mr-1" /> Lưu
              </button>
              <button onClick={handleCancel} className="text-sm px-3 py-1 border rounded hover:bg-gray-100 inline-flex items-center">
                <X className="h-4 w-4 mr-1" /> Hủy
              </button>
            </>
          )}
        </div>
      </div>

      <div className="border rounded p-4 space-y-2 bg-white">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-blue-600" />
          <span className="font-medium">Bệnh Nhân:</span> {progress.patientName}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-green-600" />
          <span className="font-medium">Bác Sĩ:</span> {progress.dentistName}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <FileText className="h-4 w-4 text-purple-600" />
          <span className="font-medium">Hồ Sơ:</span> ID: {progress.treatmentRecordID}
        </div>
      </div>

      <div className="border rounded p-4 bg-white space-y-4">
        {editing ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên Tiến Độ</label>
                <input value={editForm.progressName} onChange={e => setEditForm(f => ({ ...f, progressName: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng Thái</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded px-3 py-2">
                  {Object.entries(statusConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Thời Gian (phút)</label>
              <input type="number" value={editForm.duration} onChange={e => setEditForm(f => ({ ...f, duration: Number(e.target.value) }))} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nội Dung</label>
              <textarea value={editForm.progressContent} onChange={e => setEditForm(f => ({ ...f, progressContent: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mô Tả</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded px-3 py-2" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ghi Chú</label>
              <textarea value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} className="w-full border rounded px-3 py-2" rows={2} />
            </div>
          </>
        ) : (
          <>
            <div className="text-lg font-semibold">{progress.progressName}</div>
            <div className="flex gap-6 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(progress.duration || 0)}</div>
              {progress.endTime && (
                <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatVietnameseDateWithDay(new Date(progress.endTime))}</div>
              )}
            </div>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{progress.progressContent || "Chưa có nội dung"}</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{progress.description || "Chưa có mô tả"}</p>
            {progress.note && <p className="text-gray-700 bg-yellow-50 p-3 border border-yellow-300 rounded">{progress.note}</p>}
          </>
        )}
      </div>

      <div className="border rounded p-4 bg-white grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500">Tạo lúc:</span><br />{formatVietnameseDateFull(new Date(progress.createdAt))}</div>
        <div><span className="text-gray-500">Tạo bởi:</span><br />{progress.createdBy ?? "Không rõ"}</div>
        <div><span className="text-gray-500">Cập nhật lúc:</span><br />{progress.updatedAt ? formatVietnameseDateFull(new Date(progress.updatedAt)) : "Chưa cập nhật"}</div>
        <div><span className="text-gray-500">Cập nhật bởi:</span><br />{progress.updatedBy ?? "Không rõ"}</div>
      </div>
    </div>
  )
}
