import { useEffect, useState } from "react"
import { Eye, User, UserCheck, Clock, CalendarClock } from "lucide-react"
import { getTreatmentProgressById } from "@/services/treatmentProgressService"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { useParams } from "react-router"
import { Skeleton } from "../ui/skeleton"
import { Button } from "@/components/ui/button"
import { Pagination } from "../ui/Pagination"

const DEFAULT_ITEMS_PER_PAGE = 5

export function TreatmentProgressList({
  onViewProgress,
}: {
  onViewProgress?: (progress: TreatmentProgress) => void
}) {
  const [data, setData] = useState<TreatmentProgress[]>([])
  const [loading, setLoading] = useState(true)

  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)

  const { treatmentRecordId } = useParams<{ treatmentRecordId: string }>()

  useEffect(() => {
    if (treatmentRecordId) {
      fetchData(treatmentRecordId)
    }
  }, [treatmentRecordId])

  const fetchData = async (id: string) => {
    setLoading(true)
    try {
      const res = await getTreatmentProgressById(id)
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
      <span className={`px-2 py-1 text-xs font-medium rounded ${statusClass}`}>
        {status || "Chưa rõ"}
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
            {paginatedData.map((item) => (
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
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            className="pt-4"
          />
        </>
      )}
    </div>
  )
}
