import { useState, useEffect } from "react"
import { Eye, User, UserCheck, Clock, CalendarClock } from "lucide-react"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { Skeleton } from "../ui/skeleton"
import { Button } from "@/components/ui/button"
import { Pagination } from "../ui/Pagination"

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
  const [page, setPage] = useState(1)
  const itemsPerPage = 3

  useEffect(() => {
    setPage(1)
  }, [data,])


  const renderStatusBadge = (status?: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      "Đang tiến hành": {
        label: "Đang tiến hành",
        className: "bg-blue-100 text-blue-800 border border-blue-200",
      },
      "Tạm dừng": {
        label: "Tạm dừng",
        className: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      },
      "Đã huỷ": {
        label: "Đã huỷ",
        className: "bg-red-100 text-red-800 border border-red-200",
      },
      "Đã hoàn thành": {
        label: "Đã hoàn thành",
        className: "bg-green-100 text-green-800 border border-green-200",
      },
      "Chưa bắt đầu": {
        label: "Chưa bắt đầu",
        className: "bg-gray-100 text-gray-800 border border-gray-200",
      },
    }

    const current = statusMap[status ?? "Chưa bắt đầu"] ?? {
      label: status ?? "Không rõ",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    }

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded ${current.className}`}>
        {current.label}
      </span>
    )
  }

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="space-y-6">
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
      ) : data.length === 0 ? (
        <div className="text-center text-gray-500">Không có tiến trình điều trị nào.</div>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedData.map((item) => {
              return (
                <div
                  className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition relative`}
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

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => onViewProgress?.(item)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Xem
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data.length}
            className="pt-4"
          />
        </>
      )}
    </div>
  )
}
