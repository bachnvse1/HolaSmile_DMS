import { useState, useEffect } from "react"
import { Eye, User, UserCheck, Clock, CalendarClock, Filter } from "lucide-react"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { Skeleton } from "../ui/skeleton"
import { Button } from "@/components/ui/button"
import { Pagination } from "../ui/Pagination"
import TaskListModal from "@/components/task/TaskListModal"

export function TreatmentProgressList({
  data,
  loading,
  onViewProgress,
}: {
  data: TreatmentProgress[]
  loading?: boolean
  onViewProgress?: (progress: TreatmentProgress) => void
  highlightId?: number
}) {
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(3)
  const [openTaskListModal, setOpenTaskListModal] = useState(false)
  const [selectedProgressId, setSelectedProgressId] = useState<number | null>(null)

  useEffect(() => {
    setCurrentPage(1)
  }, [data, statusFilter])

  const filtered = data.filter((item) => {
    const matchStatus = statusFilter === "all" || item.status === statusFilter
    return matchStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const renderStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      "in-progress": { label: "Đang điều trị", className: "bg-blue-100 text-blue-800 border border-blue-200" },
      "canceled": { label: "Đã huỷ", className: "bg-red-100 text-red-800 border border-red-200" },
      "completed": { label: "Đã hoàn thành", className: "bg-green-100 text-green-800 border border-green-200" },
      "pending": { label: "Đã lên lịch", className: "bg-gray-100 text-gray-800 border border-gray-200" },
    }
    const current = statusMap[status ?? "Chưa bắt đầu"] ?? {
      label: status ?? "Không rõ",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    }
    return <span className={`px-3 py-1 text-xs font-semibold rounded ${current.className}`}>{current.label}</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Đã lên lịch</option>
            <option value="in-progress">Đang điều trị</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="canceled">Đã huỷ</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
              <Skeleton className="h-5 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-gray-500">Không có tiến trình điều trị nào phù hợp.</div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedData.map((item) => (
              <div
                key={item.treatmentProgressID}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition relative"
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
                      <span>
                        {item.updatedAt || item.createdAt
                          ? formatVietnameseDateFull(new Date(item.updatedAt || item.createdAt!))
                          : "Không rõ thời gian"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => onViewProgress?.(item)}>
                      <Eye className="h-4 w-4 mr-1" /> Xem
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedProgressId(item.treatmentProgressID)
                        setOpenTaskListModal(true)
                      }}
                    >
                      Việc đã giao
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            className="mt-4"
          />
        </>
      )}

      <TaskListModal open={openTaskListModal} onClose={() => setOpenTaskListModal(false)} treatmentProgressID={selectedProgressId ?? undefined} />
    </div>
  )
}
