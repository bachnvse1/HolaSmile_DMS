import { useEffect, useState, useMemo, useCallback } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { EyeIcon, MoreHorizontalIcon, Trash2Icon, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "react-toastify"
import { MaintenanceDetailsModal } from "./MaintenanceDetailsModal"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"
import { CreateTransactionModal } from "./CreateTransactionModal"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import { getMaintenanceList, updateMaintenanceStatus } from "@/services/maintenanceService"

type MaintenanceStatus = "Pending" | "Approved"

interface Supply {
  supplyId: number
  name: string
  unit: string
  price: number
  expiryDate?: string | null
}

interface MaintenanceRecord {
  maintenanceId: number
  maintenancedate: string
  description: string
  status: MaintenanceStatus
  price: number
  supplies: Supply[]
  createdAt?: string
  updatedAt?: string
}

interface MaintenanceTableProps {
  refreshTrigger: number
}

interface ApiError {
  response?: {
    data?: {
      message?: string
      code?: string
    }
  }
  message?: string
}

const ITEMS_PER_PAGE = 5

const STATUS_CONFIG = {
  Pending: { label: "Đang chờ phê duyệt", variant: "warning" as const },
  Approved: { label: "Đã phê duyệt", variant: "success" as const }
} as const

const getNextStatus = (status: MaintenanceStatus): MaintenanceStatus => 
  status === "Approved" ? "Pending" : "Approved"

const toNumber = (value: any, defaultValue = 0): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : defaultValue
}

const normalizeStatus = (status: any): MaintenanceStatus => {
  const statusStr = String(status ?? "").toLowerCase()
  return statusStr === "approved" || statusStr === "đã phê duyệt"
    ? "Approved"
    : "Pending"
}

const mapApiSupply = (apiSupply: any): Supply => ({
  supplyId: toNumber(apiSupply.supplyId ?? apiSupply.SupplyID ?? apiSupply.id ?? apiSupply.ID),
  name: String(apiSupply.name ?? apiSupply.Name ?? ""),
  unit: String(apiSupply.unit ?? apiSupply.Unit ?? ""),
  price: toNumber(apiSupply.price ?? apiSupply.Price, 0),
  expiryDate: apiSupply.expiryDate ?? apiSupply.ExpiryDate ?? null,
})

const mapApiRecord = (api: any): MaintenanceRecord | null => {
  try {
    const maintenanceId = toNumber(api.maintenanceId ?? api.MaintenanceId ?? api.id ?? api.ID)
    
    if (!maintenanceId) {
      console.warn("Missing maintenanceId in API response:", api)
      return null
    }

    return {
      maintenanceId,
      maintenancedate: api.maintenanceDate ?? api.MaintenanceDate ?? api.maintenancedate ?? 
                      api.createdAt ?? api.CreatedAt ?? new Date().toISOString(),
      description: String(api.description ?? api.Description ?? ""),
      status: normalizeStatus(api.status ?? api.Status ?? "Pending"),
      price: toNumber(api.price ?? api.Price, 0),
      supplies: Array.isArray(api.supplies ?? api.Supplies) 
        ? (api.supplies ?? api.Supplies).map(mapApiSupply).filter(Boolean)
        : [],
      createdAt: api.createdAt ?? api.CreatedAt,
      updatedAt: api.updatedAt ?? api.UpdatedAt
    }
  } catch (error) {
    console.error("Error mapping API record:", error, api)
    return null
  }
}

const handleApiError = (error: unknown, defaultMessage: string): void => {
  const apiError = error as ApiError
  const message = 
    apiError?.response?.data?.message || 
    apiError?.message || 
    defaultMessage
  toast.error(message)
}

const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: vi })
  } catch (error) {
    console.warn("Error formatting date:", error, dateString)
    return "Ngày không hợp lệ"
  }
}

const formatCurrency = (amount: number): string => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    return `${amount.toLocaleString("vi-VN")} VND`
  }
}

export function MaintenanceTable({ refreshTrigger }: MaintenanceTableProps) {
  const [state, setState] = useState({
    searchTerm: "",
    statusFilter: "Tất cả" as "Tất cả" | MaintenanceStatus,
    currentPage: 1,
    isLoading: true,
    error: null as string | null,
  })

  const [records, setRecords] = useState<MaintenanceRecord[]>([])
  
  const [modals, setModals] = useState({
    selectedMaintenanceId: null as number | null,
    isDetailsOpen: false,
    isTransactionOpen: false,
    isDeleteOpen: false,
    isConfirmStatusOpen: false,
  })

  const [statusUpdate, setStatusUpdate] = useState({
    target: null as { id: number; current: MaintenanceStatus } | null,
    isUpdating: false,
  })

  const fetchMaintenanceRecords = useCallback(async (): Promise<MaintenanceRecord[]> => {
    try {
      const response = await getMaintenanceList()
      console.log("[Maintenance] API response:", response)

      const rawData = Array.isArray(response) ? response :
                     response?.data ?? response?.items ?? response?.result ?? 
                     response?.records ?? response?.maintenanceList ?? 
                     response?.maintenance ?? []

      const dataArray: any[] = Array.isArray(rawData) ? rawData : []
      
      return dataArray
        .map(mapApiRecord)
        .filter((record): record is MaintenanceRecord => record !== null)
    } catch (error) {
      console.error("Error fetching maintenance records:", error)
      handleApiError(error, "Không thể tải danh sách bảo trì.")
      return []
    }
  }, [])

  const loadRecords = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const data = await fetchMaintenanceRecords()
      setRecords(data)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        currentPage: 1,
        error: null 
      }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: "Không thể tải danh sách bảo trì." 
      }))
    }
  }, [fetchMaintenanceRecords])

  useEffect(() => {
    loadRecords()
  }, [refreshTrigger, loadRecords])

  const filteredRecords = useMemo(() => {
    let filtered = records

    if (state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase().trim()
      filtered = filtered.filter(record => 
        record.description.toLowerCase().includes(searchLower) ||
        record.maintenanceId.toString().includes(searchLower)
      )
    }

    if (state.statusFilter !== "Tất cả") {
      filtered = filtered.filter(record => record.status === state.statusFilter)
    }

    return filtered.sort((a, b) => 
      new Date(b.maintenancedate).getTime() - new Date(a.maintenancedate).getTime()
    )
  }, [records, state.searchTerm, state.statusFilter])

  const pagination = useMemo(() => {
    const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE
    const paginatedData = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE)

    return {
      totalPages,
      paginatedData,
      totalRecords: filteredRecords.length,
      hasNext: state.currentPage < totalPages,
      hasPrev: state.currentPage > 1,
    }
  }, [filteredRecords, state.currentPage])

  const handleViewDetails = useCallback((id: number) => {
    setModals(prev => ({
      ...prev,
      selectedMaintenanceId: id,
      isDetailsOpen: true,
    }))
  }, [])

  const handleCreatePaymentVoucher = useCallback((id: number) => {
    setModals(prev => ({
      ...prev,
      selectedMaintenanceId: id,
      isTransactionOpen: true,
    }))
  }, [])

  const handleDeleteRecord = useCallback((id: number) => {
    setModals(prev => ({
      ...prev,
      selectedMaintenanceId: id,
      isDeleteOpen: true,
    }))
  }, [])

  const openConfirmStatus = useCallback((id: number, currentStatus: MaintenanceStatus) => {
    setStatusUpdate({ target: { id, current: currentStatus }, isUpdating: false })
    setModals(prev => ({ ...prev, isConfirmStatusOpen: true }))
  }, [])

  const confirmToggleStatus = useCallback(async () => {
    if (!statusUpdate.target) return

    setStatusUpdate(prev => ({ ...prev, isUpdating: true }))

    try {
      await updateMaintenanceStatus(statusUpdate.target.id)
      toast.success("Cập nhật trạng thái thành công.")
      
      setModals(prev => ({ ...prev, isConfirmStatusOpen: false }))
      setStatusUpdate({ target: null, isUpdating: false })
      
      await loadRecords()
    } catch (error) {
      handleApiError(error, "Không thể cập nhật trạng thái.")
    } finally {
      setStatusUpdate(prev => ({ ...prev, isUpdating: false }))
    }
  }, [statusUpdate.target, loadRecords])

  const closeModal = useCallback((modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false, selectedMaintenanceId: null }))
  }, [])

  const handleActionCompleted = useCallback(async () => {
    await loadRecords()
    const newTotalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)
    if (state.currentPage > newTotalPages && newTotalPages > 0) {
      setState(prev => ({ ...prev, currentPage: newTotalPages }))
    }
  }, [loadRecords, filteredRecords.length, state.currentPage])

  const handleSearchChange = useCallback((value: string) => {
    setState(prev => ({ 
      ...prev, 
      searchTerm: value, 
      currentPage: 1 
    }))
  }, [])

  const handleStatusFilterChange = useCallback((value: "Tất cả" | MaintenanceStatus) => {
    setState(prev => ({ 
      ...prev, 
      statusFilter: value, 
      currentPage: 1 
    }))
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setState(prev => ({ ...prev, currentPage: page }))
  }, [])

  const renderLoadingState = () => (
    <div className="text-center py-12">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-lg font-medium">Đang tải dữ liệu bảo trì...</p>
      <p className="text-sm text-muted-foreground">Vui lòng đợi trong giây lát</p>
    </div>
  )

  const renderErrorState = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
      <p className="text-lg font-medium text-red-600">Có lỗi xảy ra</p>
      <p className="text-sm text-muted-foreground mb-4">{state.error}</p>
      <Button onClick={loadRecords} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Thử lại
      </Button>
    </div>
  )

  const renderEmptyState = () => (
    <TableRow>
      <TableCell colSpan={5} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Không có bản ghi bảo trì</p>
          <p className="text-sm">
            {state.searchTerm || state.statusFilter !== "Tất cả" 
              ? "Thử thay đổi bộ lọc để xem thêm kết quả."
              : "Chưa có bản ghi bảo trì nào được tạo."}
          </p>
        </div>
      </TableCell>
    </TableRow>
  )

  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
        <div className="text-sm text-muted-foreground">
          Hiển thị {Math.min((state.currentPage - 1) * ITEMS_PER_PAGE + 1, pagination.totalRecords)} - {Math.min(state.currentPage * ITEMS_PER_PAGE, pagination.totalRecords)} trong tổng số {pagination.totalRecords} bản ghi
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(state.currentPage - 1)}
            disabled={!pagination.hasPrev}
          >
            Trang trước
          </Button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(page => {
              const current = state.currentPage
              return page === 1 || page === pagination.totalPages || 
                     (page >= current - 1 && page <= current + 1)
            })
            .map((page, index, array) => {
              const showEllipsis = index > 0 && array[index - 1] !== page - 1
              return (
                <div key={page} className="flex items-center">
                  {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                  <Button
                    variant={state.currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                </div>
              )
            })}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePageChange(state.currentPage + 1)}
            disabled={!pagination.hasNext}
          >
            Trang sau
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full sm:max-w-sm">
          <Input
            placeholder="Tìm kiếm theo mô tả hoặc ID..."
            value={state.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        <Select
          value={state.statusFilter}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Tất cả">Tất cả trạng thái</SelectItem>
            <SelectItem value="Pending">Đang chờ phê duyệt</SelectItem>
            <SelectItem value="Approved">Đã phê duyệt</SelectItem>
          </SelectContent>
        </Select>
        
        {(state.searchTerm || state.statusFilter !== "Tất cả") && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setState(prev => ({ 
              ...prev, 
              searchTerm: "", 
              statusFilter: "Tất cả", 
              currentPage: 1 
            }))}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {state.isLoading ? (
        renderLoadingState()
      ) : state.error ? (
        renderErrorState()
      ) : (
        <>
          <div className="rounded-lg shadow-md overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="font-semibold">Ngày bảo trì</TableHead>
                  <TableHead className="font-semibold">Mô tả</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold text-right">Tổng chi phí</TableHead>
                  <TableHead className="font-semibold text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.paginatedData.length > 0 
                  ? pagination.paginatedData.map((record, index) => (
                      <TableRow 
                        key={record.maintenanceId} 
                        className={`hover:bg-muted/40 transition-colors ${
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        }`}
                      >
                        <TableCell className="font-medium">
                          {formatDate(record.maintenancedate)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="truncate" title={record.description}>
                              {record.description}
                            </p>
                            {record.supplies.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {record.supplies.length} vật tư
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={STATUS_CONFIG[record.status].variant}
                            className="whitespace-nowrap"
                          >
                            {STATUS_CONFIG[record.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.price)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 p-0 hover:bg-muted"
                              >
                                <MoreHorizontalIcon className="h-4 w-4" />
                                <span className="sr-only">Mở menu hành động</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[180px]">
                              <DropdownMenuItem 
                                onClick={() => handleViewDetails(record.maintenanceId)}
                                className="cursor-pointer"
                              >
                                <EyeIcon className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </DropdownMenuItem>
                              
                              {record.status === "Approved" && (
                                <DropdownMenuItem
                                  onClick={() => handleCreatePaymentVoucher(record.maintenanceId)}
                                  className="cursor-pointer"
                                >
                                  <span className="mr-2 h-4 w-4">Đ</span>
                                  Tạo phiếu chi
                                </DropdownMenuItem>
                              )}
                              
                              {record.status !== "Approved" && (
                                <DropdownMenuItem 
                                  onClick={() => openConfirmStatus(record.maintenanceId, record.status)}
                                  className="cursor-pointer"
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Đổi trạng thái
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => handleDeleteRecord(record.maintenanceId)}
                                className="text-red-600 cursor-pointer focus:text-red-600"
                              >
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Xóa bản ghi
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  : renderEmptyState()
                }
              </TableBody>
            </Table>
          </div>

          {renderPagination()}
        </>
      )}

      <MaintenanceDetailsModal 
        maintenanceId={modals.selectedMaintenanceId}
        isOpen={modals.isDetailsOpen}
        onOpenChange={() => closeModal('isDetailsOpen')}
      />
      
      <CreateTransactionModal 
        maintenanceId={modals.selectedMaintenanceId}
        isOpen={modals.isTransactionOpen}
        onOpenChange={() => closeModal('isTransactionOpen')}
        onVoucherCreated={handleActionCompleted}
      />
      
      <DeleteConfirmationModal 
        maintenanceId={modals.selectedMaintenanceId}
        isOpen={modals.isDeleteOpen}
        onOpenChange={() => closeModal('isDeleteOpen')}
        onRecordDeleted={handleActionCompleted}
        maintenanceDescription={
          records.find(r => r.maintenanceId === modals.selectedMaintenanceId)?.description
        }
      />

      <ConfirmModal
        isOpen={modals.isConfirmStatusOpen}
        onClose={() => setModals(prev => ({ ...prev, isConfirmStatusOpen: false }))}
        onConfirm={confirmToggleStatus}
        title="Xác nhận cập nhật trạng thái"
        message={
          statusUpdate.target
            ? `Bạn có chắc muốn chuyển trạng thái từ "${STATUS_CONFIG[statusUpdate.target.current].label}" sang "${STATUS_CONFIG[getNextStatus(statusUpdate.target.current)].label}"?`
            : "Bạn có chắc muốn cập nhật trạng thái?"
        }
        confirmText="Xác nhận cập nhật"
        confirmVariant="default"
        isLoading={statusUpdate.isUpdating}
      />
    </div>
  )
}