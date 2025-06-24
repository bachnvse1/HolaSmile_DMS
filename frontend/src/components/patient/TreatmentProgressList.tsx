import { useEffect, useState } from "react"
import { Eye, User, UserCheck, Clock, CalendarClock } from "lucide-react"
import { getTreatmentProgressById } from "@/services/treatmentProgressService"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"

export function TreatmentProgressList({
  treatmentRecordId,
  onViewProgress,
}: {
  treatmentRecordId: string
  onViewProgress?: (progress: TreatmentProgress) => void
}) {
  const [data, setData] = useState<TreatmentProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [treatmentRecordId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getTreatmentProgressById(treatmentRecordId)
      setData(res)
    } catch (err) {
      console.error("Lỗi tải danh sách:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderStatusBadge = (status?: string) => {
    const statusClass = {
      "Đang thực hiện": "bg-blue-100 text-blue-700",
      "Tạm dừng": "bg-yellow-100 text-yellow-700",
      "Đã huỷ": "bg-red-100 text-red-700",
      "Hoàn thành": "bg-green-100 text-green-700",
      "Chưa bắt đầu": "bg-gray-100 text-gray-600",
    }[status ?? "Chưa bắt đầu"]

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${statusClass}`}>{status || "Chưa rõ"}</span>
    )
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid gap-4">
          {data.map((item) => (
            <div
              key={item.treatmentProgressID}
              className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-base">{item.progressName}</h3>
                    {renderStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>{item.patientName}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span>{item.dentistName}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600 gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span>{item.duration ?? "--"} phút</span>
                  </div>

                  <div className="flex items-center text-xs text-gray-400 gap-2">
                    <CalendarClock className="h-4 w-4" />
                    <span>{formatVietnameseDateFull(new Date(item.updatedAt || item.createdAt))}</span>
                  </div>
                </div>

                <button
                  className="text-sm border border-gray-300 px-3 py-1 rounded hover:bg-gray-100 flex items-center mt-1"
                  onClick={() => onViewProgress?.(item)}
                >
                  <Eye className="inline h-4 w-4 mr-1" /> Xem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
