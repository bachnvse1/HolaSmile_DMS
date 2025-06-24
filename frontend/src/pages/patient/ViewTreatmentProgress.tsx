import { useState } from "react"
import { TreatmentProgressList } from "@/components/patient/TreatmentProgressList" 
import { TreatmentProgressView } from "@/components/patient/TreatmentProgressView" 
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { FileText } from "lucide-react"

export default function TreatmentProgressDemo() {
  const [selectedProgress, setSelectedProgress] = useState<TreatmentProgress | null>(null)

  const renderStatusBadge = (status?: string) => {
    const statusClass = {
      "Đang thực hiện": "bg-blue-100 text-blue-700",
      "Tạm dừng": "bg-yellow-100 text-yellow-700",
      "Đã huỷ": "bg-red-100 text-red-700",
      "Hoàn thành": "bg-green-100 text-green-700",
      "Chưa bắt đầu": "bg-gray-100 text-gray-600",
    }[status ?? "Chưa bắt đầu"]

    return (
      <span className={`px-4 py-2 text-base font-bold rounded shadow-sm ${statusClass}`}>{status || "Chưa rõ"}</span>
    )
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-6 space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
            <FileText className="h-6 w-6" /> Danh Sách Tiến Độ Điều Trị
          </h1>
          <p className="text-gray-500 text-sm">Quản lý và theo dõi tiến độ điều trị của bệnh nhân</p>
          <p className="text-gray-400 text-sm">Theo dõi và cập nhật tiến độ điều trị của bệnh nhân theo thời gian</p>
        </div>
        {selectedProgress?.status && renderStatusBadge(selectedProgress.status)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {selectedProgress ? (
            <TreatmentProgressView progress={selectedProgress} />
          ) : (
            <div className="border rounded-lg p-6 text-center text-gray-500 bg-gray-50">
              Vui lòng chọn một tiến độ điều trị từ danh sách bên phải để xem chi tiết.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="w-full border rounded-lg px-4 py-2 text-sm"
              placeholder="Tìm theo bác sĩ hoặc bệnh nhân..."
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1016.65 2.5a7.5 7.5 0 000 15z" /></svg>
            </button>
          </div>

          <TreatmentProgressList
            treatmentRecordId="1"
            onViewProgress={(p) => setSelectedProgress(p)}
          />
        </div>
      </div>
    </div>
  )
}
