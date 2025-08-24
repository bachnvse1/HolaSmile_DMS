import { useState, useEffect, useMemo, useCallback } from "react"
import { Eye, User, UserCheck, Clock, CalendarClock, Filter, FileText, Search } from "lucide-react"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { Skeleton } from "../ui/skeleton"
import { Button } from "@/components/ui/button2"
import { Pagination } from "../ui/Pagination"
import TaskListModal from "@/components/task/TaskListModal"
import { useAuth } from "@/hooks/useAuth"
import { useUserInfo } from "@/hooks/useUserInfo"

const STATUS_MAP = {
  "in-progress": { label: "Đang điều trị", className: "bg-blue-100 text-blue-800 border-blue-200" },
  "canceled": { label: "Đã hủy", className: "bg-red-100 text-red-800 border-red-200" },
  "completed": { label: "Đã hoàn thành", className: "bg-green-100 text-green-800 border-green-200" },
  "pending": { label: "Đã lên lịch", className: "bg-gray-100 text-gray-800 border-gray-200" },
} as const

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Đã lên lịch" },
  { value: "in-progress", label: "Đang điều trị" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "canceled", label: "Đã hủy" },
] as const

interface Props {
  data: TreatmentProgress[]
  loading?: boolean
  onViewProgress?: (progress: TreatmentProgress) => void
  highlightId?: number
}

interface FilterState {
  status: string
  searchKeyword: string
  currentPage: number
  itemsPerPage: number
}

interface TaskModalState {
  isOpen: boolean
  selectedProgressId: number | null
}

const useFilterState = () => {
  const [filterState, setFilterState] = useState<FilterState>({
    status: "all",
    searchKeyword: "",
    currentPage: 1,
    itemsPerPage: 5,
  })

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }))
  }, [])

  return { filterState, updateFilter }
}

const useTaskModal = () => {
  const [modalState, setModalState] = useState<TaskModalState>({
    isOpen: false,
    selectedProgressId: null,
  })

  const openModal = useCallback((progressId: number) => {
    setModalState({
      isOpen: true,
      selectedProgressId: progressId,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
      selectedProgressId: null,
    })
  }, [])

  return { modalState, openModal, closeModal }
}

export function TreatmentProgressList({ data, loading, onViewProgress, highlightId }: Props) {
  const { filterState, updateFilter } = useFilterState()
  const { modalState, openModal, closeModal } = useTaskModal()
  const { role } = useAuth()
  const userInfo = useUserInfo()
  
  const isPatient = role === "Patient"

  useEffect(() => {
    updateFilter({ currentPage: 1 })
  }, [data, filterState.status, filterState.searchKeyword, updateFilter])

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateA.getTime() - dateB.getTime() 
    })
  }, [data])

  const { filteredData, paginatedData, totalPages } = useMemo(() => {
    const filtered = sortedData.filter((item) => {
      const matchStatus = filterState.status === "all" || item.status === filterState.status
      
      const matchSearch = !filterState.searchKeyword || 
        !filterState.searchKeyword.trim() || 
        (item.progressName && 
         item.progressName.toLowerCase().includes(filterState.searchKeyword.toLowerCase().trim()))
      
      return matchStatus && matchSearch
    })

    const totalPages = Math.ceil(filtered.length / filterState.itemsPerPage)
    const paginated = filtered.slice(
      (filterState.currentPage - 1) * filterState.itemsPerPage,
      filterState.currentPage * filterState.itemsPerPage
    )

    return {
      filteredData: filtered,
      paginatedData: paginated,
      totalPages,
    }
  }, [sortedData, filterState])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ searchKeyword: e.target.value })
  }

  const renderStatusBadge = useCallback((status?: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? {
      label: status ?? "Không rõ",
      className: "bg-gray-100 text-gray-800 border-gray-200",
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }, [])

  const renderSearchAndFilterControls = () => (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          placeholder="Tìm kiếm theo tên tiến trình..."
          value={filterState.searchKeyword}
          onChange={handleSearchChange}
          aria-label="Tìm kiếm tiến trình điều trị"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      <div className="flex items-center gap-2 min-w-fit">
        <Filter className="h-4 w-4 text-gray-500" />
        <select
          aria-label="Lọc theo trạng thái tiến trình điều trị"
          value={filterState.status}
          onChange={(e) => updateFilter({ status: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[160px]"
        >
          {FILTER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  const renderLoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex justify-between items-start">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderProgressItem = useCallback((item: TreatmentProgress) => {
    const isHighlighted = highlightId === item.treatmentProgressID
    
    return (
      <div
        key={item.treatmentProgressID}
        className={`border rounded-lg p-4 bg-white hover:shadow-md transition-all duration-200 cursor-pointer ${
          isHighlighted 
            ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onViewProgress?.(item)}
      >
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-base text-gray-900 flex items-center gap-2 flex-1 min-w-0">
                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span className="truncate" title={item.progressName || "Tên tiến trình không có"}>
                  {item.progressName || "Tên tiến trình không có"}
                </span>
              </h3>
              {renderStatusBadge(item.status)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-600 gap-2">
                <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-500">BN:</span>
                <span className="font-medium truncate" title={item.patientName || "Không rõ"}>
                  {item.patientName || "Không rõ"}
                </span>
              </div>
              
              <div className="flex items-center text-gray-600 gap-2">
                <UserCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-500">BS:</span>
                <span className="font-medium truncate" title={item.dentistName || "Không rõ"}>
                  {item.dentistName || "Không rõ"}
                </span>
              </div>
              
              <div className="flex items-center text-gray-600 gap-2">
                <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-gray-500">Thời gian:</span>
                <span className="font-medium">{item.duration ?? "--"} phút</span>
              </div>
              
              <div className="flex items-center text-gray-500 gap-2 text-xs">
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate" title={
                  item.updatedAt || item.createdAt
                    ? formatVietnameseDateFull(new Date(item.updatedAt || item.createdAt!))
                    : "Không rõ thời gian"
                }>
                  {item.updatedAt || item.createdAt
                    ? new Date(item.updatedAt || item.createdAt!).toLocaleDateString('vi-VN')
                    : "Không rõ"
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation()
                onViewProgress?.(item)
              }}
              className="whitespace-nowrap text-xs px-3 py-1.5 h-auto"
            >
              <Eye className="h-3 w-3 mr-1" /> Xem
            </Button>
            
            {userInfo.role === "Dentist" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openModal(item.treatmentProgressID)
                }}
                className="whitespace-nowrap text-xs px-3 py-1.5 h-auto"
              >
                Việc đã giao
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }, [highlightId, renderStatusBadge, onViewProgress, userInfo.role, openModal])

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="bg-gray-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Không có tiến trình nào
      </h3>
      <p className="text-gray-500 text-sm">
        {filterState.searchKeyword || filterState.status !== "all" 
          ? "Thử thay đổi bộ lọc để xem thêm kết quả"
          : "Chưa có tiến trình điều trị nào được tạo"
        }
      </p>
    </div>
  )

  const renderPagination = () => (
    totalPages > 1 && (
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Pagination
          currentPage={filterState.currentPage}
          totalPages={totalPages}
          onPageChange={(page) => updateFilter({ currentPage: page })}
          totalItems={filteredData.length}
          itemsPerPage={filterState.itemsPerPage}
          onItemsPerPageChange={(itemsPerPage) => updateFilter({ itemsPerPage })}
        />
      </div>
    )
  )

  const renderTaskModal = () => (
    !isPatient && modalState.selectedProgressId && (
      <TaskListModal
        open={modalState.isOpen}
        onClose={closeModal}
        treatmentProgressID={modalState.selectedProgressId}
      />
    )
  )

  return (
    <div className="space-y-4">
      {renderSearchAndFilterControls()}
      
      {loading ? (
        renderLoadingSkeleton()
      ) : filteredData.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {paginatedData.map(renderProgressItem)}
          </div>
          
          {renderPagination()}
        </>
      )}
      
      {renderTaskModal()}
    </div>
  )
}