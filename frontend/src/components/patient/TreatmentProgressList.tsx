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

// Constants
const STATUS_MAP = {
  "in-progress": { label: "Đang điều trị", className: "bg-blue-100 text-blue-800 border border-blue-200" },
  "canceled": { label: "Đã huỷ", className: "bg-red-100 text-red-800 border border-red-200" },
  "completed": { label: "Đã hoàn thành", className: "bg-green-100 text-green-800 border border-green-200" },
  "pending": { label: "Đã lên lịch", className: "bg-gray-100 text-gray-800 border border-gray-200" },
} as const

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Đã lên lịch" },
  { value: "in-progress", label: "Đang điều trị" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "canceled", label: "Đã huỷ" },
] as const

// Types
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

// Custom hooks
const useFilterState = () => {
  const [filterState, setFilterState] = useState<FilterState>({
    status: "all",
    searchKeyword: "",
    currentPage: 1,
    itemsPerPage: 3,
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

  // Reset page when data or filter changes
  useEffect(() => {
    updateFilter({ currentPage: 1 })
  }, [data, filterState.status, filterState.searchKeyword, updateFilter])

  // Filtered and paginated data with search
  const { filteredData, paginatedData, totalPages } = useMemo(() => {
    const filtered = data.filter((item) => {
      // Filter by status
      const matchStatus = filterState.status === "all" || item.status === filterState.status
      
      // Filter by search keyword
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
  }, [data, filterState])

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilter({ searchKeyword: e.target.value })
  }

  // Render functions
  const renderStatusBadge = useCallback((status?: string) => {
    const statusInfo = STATUS_MAP[status as keyof typeof STATUS_MAP] ?? {
      label: status ?? "Không rõ",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    }
    
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }, [])

  const renderSearchAndFilterControls = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <input
          type="text"
          className="w-full border rounded-lg px-4 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tìm kiếm tiến trình điều trị..."
          value={filterState.searchKeyword}
          onChange={handleSearchChange}
          aria-label="Tìm kiếm tiến trình điều trị"
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          aria-label="Lọc theo trạng thái tiến trình điều trị"
          value={filterState.status}
          onChange={(e) => updateFilter({ status: e.target.value })}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex flex-col gap-2">
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
        className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow ${
          isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-base text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                {item.progressName || "Tên tiến trình không có"}
              </h3>
              {renderStatusBadge(item.status)}
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Bệnh nhân:</span>
                <span>{item.patientName || "Không rõ"}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="font-medium">Bác sĩ:</span>
                <span>{item.dentistName || "Không rõ"}</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">Thời gian:</span>
                <span>{item.duration ?? "--"} phút</span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500 gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  {item.updatedAt || item.createdAt
                    ? formatVietnameseDateFull(new Date(item.updatedAt || item.createdAt!))
                    : "Không rõ thời gian"}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 ml-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onViewProgress?.(item)}
              className="whitespace-nowrap"
            >
              <Eye className="h-4 w-4 mr-1" /> Xem
            </Button>
            
            {userInfo.role === "Dentist" && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => openModal(item.treatmentProgressID)}
                className="whitespace-nowrap"
              >
                Việc đã giao
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }, [highlightId, renderStatusBadge, onViewProgress, isPatient, openModal])

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <p className="text-gray-500 text-lg">Không có tiến trình điều trị nào phù hợp</p>
      <p className="text-gray-400 text-sm mt-2">
        Thử thay đổi bộ lọc hoặc tạo tiến trình điều trị mới
      </p>
    </div>
  )

  const renderPagination = () => (
    <Pagination
      currentPage={filterState.currentPage}
      totalPages={totalPages}
      onPageChange={(page) => updateFilter({ currentPage: page })}
      totalItems={filteredData.length}
      itemsPerPage={filterState.itemsPerPage}
      onItemsPerPageChange={(itemsPerPage) => updateFilter({ itemsPerPage })}
      className="mt-6"
    />
  )

  const renderTaskModal = () => (
    !isPatient && (
      <TaskListModal
        open={modalState.isOpen}
        onClose={closeModal}
        treatmentProgressID={modalState.selectedProgressId || 0}
      />
    )
  )

  return (
    <div className="space-y-6">
      {renderSearchAndFilterControls()}
      
      {loading ? (
        renderLoadingSkeleton()
      ) : filteredData.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedData.map(renderProgressItem)}
          </div>
          
          {totalPages > 1 && renderPagination()}
        </>
      )}
      
      {renderTaskModal()}
    </div>
  )
}