import { useEffect, useState, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button2"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import axios from "axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { InvoiceFilterForm } from "@/components/invoice/InvoiceFilterForm"
import { InvoiceTable } from "@/components/invoice/InvoiceTable"
import { InvoiceDetailModal } from "@/components/invoice/InvoiceDetailModal"
import { UpdateInvoiceModal } from "@/components/invoice/UpdateInvoiceModal"

import { invoiceService } from "@/services/invoiceService"
import { getAllPatients } from "@/services/patientService"
import type { Patient } from "@/types/patient"
import type { Invoice } from "@/types/invoice"
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { PatientLayout } from "@/layouts/patient"
import { formatCurrency } from "@/utils/currencyUtils"

const INVOICE_STATUS_CONFIG = {
    pending: { label: "Chờ thanh toán", variant: "info" as const },
    paid: { label: "Đã thanh toán", variant: "default" as const },
    cancelled: { label: "Đã hủy", variant: "warning" as const },
    overdue: { label: "Quá hạn", variant: "destructive" as const },
} as const

const TRANSACTION_TYPE_CONFIG = {
    full: { label: "Toàn bộ", variant: "default" as const },
    partial: { label: "Một phần", variant: "outline" as const },
} as const

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10
const DEBOUNCE_DELAY = 500

interface InvoiceFilters {
    status: string
    fromDate: string
    toDate: string
    patientId: string
}

interface PaginationState {
    currentPage: number
    pageSize: number
    totalPages: number
    totalItems: number
}

interface UpdateInvoiceFormData {
    invoiceId: number;
    patientId: number;
    paymentMethod: string;
    transactionType: string;
    status: string;
    description: string;
    paidAmount: number;
}

class InvoiceFilterManager {
    private static instance: InvoiceFilterManager
    private debounceTimer: NodeJS.Timeout | null = null

    static getInstance(): InvoiceFilterManager {
        if (!InvoiceFilterManager.instance) {
            InvoiceFilterManager.instance = new InvoiceFilterManager()
        }
        return InvoiceFilterManager.instance
    }

    applyFilters(invoices: Invoice[], filters: InvoiceFilters): Invoice[] {
        return invoices.filter(invoice => {
            if (filters.status && filters.status !== "all" && invoice.status !== filters.status) {
                return false
            }

            if (filters.fromDate || filters.toDate) {
                const invoiceDate = new Date(invoice.createdAt)

                if (filters.fromDate) {
                    const fromDate = new Date(filters.fromDate)
                    fromDate.setHours(0, 0, 0, 0)
                    if (invoiceDate < fromDate) return false
                }

                if (filters.toDate) {
                    const toDate = new Date(filters.toDate)
                    toDate.setHours(23, 59, 59, 999)
                    if (invoiceDate > toDate) return false
                }
            }

            if (filters.patientId && invoice.patientId.toString() !== filters.patientId) {
                return false
            }

            return true
        })
    }

    debounceFilter(callback: () => void, delay: number = DEBOUNCE_DELAY): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
        }
        this.debounceTimer = setTimeout(callback, delay)
    }

    validateFilters(filters: InvoiceFilters): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (filters.fromDate && filters.toDate) {
            const fromDate = new Date(filters.fromDate)
            const toDate = new Date(filters.toDate)

            if (fromDate > toDate) {
                errors.push("Ngày bắt đầu phải trước ngày kết thúc")
            }

            const today = new Date()
            if (fromDate > today) {
                errors.push("Ngày bắt đầu không được vượt quá ngày hiện tại")
            }
        }

        if (filters.patientId && isNaN(Number(filters.patientId))) {
            errors.push("ID bệnh nhân không hợp lệ")
        }

        return { isValid: errors.length === 0, errors }
    }

    getFilterSummary(filters: InvoiceFilters, patientList: Patient[]): string[] {
        const summary: string[] = []

        if (filters.status && filters.status !== "all") {
            const statusLabel = INVOICE_STATUS_CONFIG[filters.status as keyof typeof INVOICE_STATUS_CONFIG]?.label
            if (statusLabel) summary.push(`Trạng thái: ${statusLabel}`)
        }

        if (filters.fromDate) {
            summary.push(`Từ: ${new Date(filters.fromDate).toLocaleDateString("vi-VN")}`)
        }

        if (filters.toDate) {
            summary.push(`Đến: ${new Date(filters.toDate).toLocaleDateString("vi-VN")}`)
        }

        if (filters.patientId) {
            const patient = patientList.find(p => p.patientId.toString() === filters.patientId)
            if (patient) summary.push(`Bệnh nhân: ${patient.fullname}`)
        }

        return summary
    }

    getSuggestedFilters(invoices: Invoice[]): Partial<InvoiceFilters>[] {
        const suggestions: Partial<InvoiceFilters>[] = []

        const patientCounts = invoices.reduce((acc, invoice) => {
            acc[invoice.patientId] = (acc[invoice.patientId] || 0) + 1
            return acc
        }, {} as Record<number, number>)

        const topPatients = Object.entries(patientCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([patientId]) => ({ patientId }))

        suggestions.push(...topPatients)

        const today = new Date().toISOString().split('T')[0]
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        suggestions.push(
            { fromDate: lastWeek, toDate: today },
            { status: "pending" },
            { status: "paid" }
        )

        return suggestions
    }

    cleanup(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }
    }
}

export default function InvoiceList() {
    const userInfo = useUserInfo()
    const filterManager = useMemo(() => InvoiceFilterManager.getInstance(), [])

    const [filters, setFilters] = useState<InvoiceFilters>({
        status: "",
        fromDate: "",
        toDate: "",
        patientId: "",
    })

    const [allInvoices, setAllInvoices] = useState<Invoice[]>([])
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
    const [paginatedData, setPaginatedData] = useState<Invoice[]>([])
    const [patientList, setPatientList] = useState<Patient[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFilterLoading, setIsFilterLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [filterErrors, setFilterErrors] = useState<string[]>([])

    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [invoiceToUpdate, setInvoiceToUpdate] = useState<Invoice | null>(null)

    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalItems: 0,
    })

    const isPatient = useMemo(() => userInfo?.role === "Patient", [userInfo?.role])
    const isReceptionist = useMemo(() => userInfo?.role === "Receptionist", [userInfo?.role])
    const hidePatientSelect = useMemo(() => isPatient, [isPatient])

    useEffect(() => {
        if (isPatient && userInfo?.roleTableId) {
            setFilters(prev => ({
                ...prev,
                patientId: userInfo.roleTableId.toString()
            }))
        }
    }, [isPatient, userInfo?.roleTableId])

    useEffect(() => {
        if (!userInfo?.role || isInitialized) return

        fetchInitialData()
        setIsInitialized(true)
    }, [userInfo?.role, isInitialized])

    useEffect(() => {
        applyFiltersWithDebounce()
    }, [filters, allInvoices])

    useEffect(() => {
        updatePagination()
    }, [filteredInvoices, pagination.pageSize])

    useEffect(() => {
        updatePaginatedData()
    }, [filteredInvoices, pagination.currentPage, pagination.pageSize])

    useEffect(() => {
        return () => {
            filterManager.cleanup()
        }
    }, [filterManager])

    const fetchInitialData = useCallback(async () => {
        if (!userInfo?.role) return

        setIsLoading(true)
        try {
            if (isPatient && userInfo.roleTableId) {
                const invoices = await invoiceService.getInvoices({
                    patientId: userInfo.roleTableId
                })
                setAllInvoices(invoices)
            } else if (isReceptionist) {
                const [invoices, patients] = await Promise.all([
                    invoiceService.getInvoices({}),
                    getAllPatients(),
                ])
                setAllInvoices(invoices)
                setPatientList(patients)
            }
        } catch (error) {
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.message || "Không thể tải dữ liệu"
                : "Lỗi không xác định"

            toast.error(errorMessage)
            console.error("Error fetching initial data:", error)
        } finally {
            setIsLoading(false)
        }
    }, [userInfo?.role, userInfo?.roleTableId, isPatient, isReceptionist])

    const applyFiltersWithDebounce = useCallback(() => {
        filterManager.debounceFilter(() => {
            setIsFilterLoading(true)

            const validation = filterManager.validateFilters(filters)
            setFilterErrors(validation.errors)

            if (validation.isValid) {
                const filtered = filterManager.applyFilters(allInvoices, filters)
                setFilteredInvoices(filtered)

                setPagination(prev => ({ ...prev, currentPage: 1 }))
            }

            setIsFilterLoading(false)
        })
    }, [filters, allInvoices, filterManager])

    const handleFilterChange = useCallback((key: string, value: string) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value }

            if (isPatient && userInfo?.roleTableId) {
                newFilters.patientId = userInfo.roleTableId.toString()
            }

            return newFilters
        })
    }, [isPatient, userInfo?.roleTableId])

    const clearFilters = useCallback(() => {
        const emptyFilters: InvoiceFilters = {
            status: "",
            fromDate: "",
            toDate: "",
            patientId: isPatient && userInfo?.roleTableId ?
                userInfo.roleTableId.toString() : "",
        }

        setFilters(emptyFilters)
        setFilterErrors([])
        setPagination(prev => ({ ...prev, currentPage: 1 }))
    }, [isPatient, userInfo?.roleTableId])

    const updatePagination = useCallback(() => {
        const totalItems = filteredInvoices.length
        const totalPages = Math.ceil(totalItems / pagination.pageSize)

        setPagination(prev => ({
            ...prev,
            totalItems,
            totalPages,
            currentPage: Math.min(prev.currentPage, totalPages || 1)
        }))
    }, [filteredInvoices.length, pagination.pageSize])

    const updatePaginatedData = useCallback(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        setPaginatedData(filteredInvoices.slice(startIndex, endIndex))
    }, [filteredInvoices, pagination.currentPage, pagination.pageSize])

    const handlePageChange = useCallback((newPage: number) => {
        setPagination(prev => ({
            ...prev,
            currentPage: Math.max(1, Math.min(newPage, prev.totalPages))
        }))
    }, [])

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        setPagination(prev => ({
            ...prev,
            pageSize: parseInt(newPageSize),
            currentPage: 1
        }))
    }, [])

    const formatDate = useCallback((dateString: string | null): string => {
        if (!dateString) return "Chưa thanh toán"

        try {
            return new Date(dateString).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (error) {
            console.error("Error formatting date:", error)
            return "Ngày không hợp lệ"
        }
    }, [])

    const getStatusBadge = useCallback((status: string) => {
        const config = INVOICE_STATUS_CONFIG[status as keyof typeof INVOICE_STATUS_CONFIG] ||
            INVOICE_STATUS_CONFIG.pending
        return <Badge variant={config.variant}>{config.label}</Badge>
    }, [])

    const getTransactionTypeBadge = useCallback((type: string) => {
        const config = TRANSACTION_TYPE_CONFIG[type as keyof typeof TRANSACTION_TYPE_CONFIG] ||
            TRANSACTION_TYPE_CONFIG.partial
        return <Badge variant={config.variant}>{config.label}</Badge>
    }, [])

    const openInvoiceDetail = useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setIsDetailOpen(true)
    }, [])

    const handleOpenUpdateModal = useCallback((invoice: Invoice) => {
        setInvoiceToUpdate(invoice)
        setIsUpdateModalOpen(true)
    }, [])

    const handleCloseUpdateModal = useCallback(() => {
        setIsUpdateModalOpen(false)
        setInvoiceToUpdate(null)
    }, [])

    const handleUpdateInvoice = useCallback(async (formData: UpdateInvoiceFormData) => {
        setIsUpdating(true)
        try {
            await invoiceService.updateInvoice(formData)

            const updatedInvoices = allInvoices.map(invoice =>
                invoice.invoiceId === formData.invoiceId
                    ? {
                        ...invoice,
                        paymentMethod: formData.paymentMethod,
                        transactionType: formData.transactionType,
                        status: formData.status,
                        description: formData.description,
                        paidAmount: formData.paidAmount,
                    }
                    : invoice
            )

            setAllInvoices(updatedInvoices)

            setTimeout(() => {
                const filtered = filterManager.applyFilters(updatedInvoices, filters)
                setFilteredInvoices(filtered)
            }, 0)

            toast.success("Cập nhật hóa đơn thành công")
            setIsUpdateModalOpen(false)
            setInvoiceToUpdate(null)
        } catch (error: any) {
            console.error("Error updating invoice:", error)
            const errorMessage = error?.response?.data?.message || error?.message || "Lỗi khi cập nhật hóa đơn"
            toast.error(errorMessage)
            throw error
        } finally {
            setIsUpdating(false)
        }
    }, [allInvoices, filterManager, filters])

    const invoiceStats = useMemo(() => {
        const totalInvoices = allInvoices.length
        const displayedInvoices = filteredInvoices.length

        const pendingInvoices = filteredInvoices.filter(invoice => invoice.status === 'pending').length
        const paidInvoices = filteredInvoices.filter(invoice => invoice.status === 'paid').length

        const grouped = new Map<number, { totalAmount: number, paidAmount: number }>()

        allInvoices.forEach(inv => {
            const id = inv.treatmentRecordId
            const prev = grouped.get(id) || { totalAmount: 0, paidAmount: 0 }

            if (!grouped.has(id)) {
                prev.totalAmount = inv.totalAmount || 0
            }

            prev.paidAmount += inv.paidAmount || 0
            grouped.set(id, prev)
        })

        const treatmentStats = Array.from(grouped.values())
        const totalTreatmentAmount = treatmentStats.reduce((sum, t) => sum + t.totalAmount, 0)
        const totalPaidAmount = treatmentStats.reduce((sum, t) => sum + t.paidAmount, 0)
        const totalRemainingAmount = totalTreatmentAmount - totalPaidAmount

        const fullyPaidTreatments = treatmentStats.filter(t => t.paidAmount >= t.totalAmount).length
        const totalTreatments = treatmentStats.length

        const completionRate = totalTreatmentAmount > 0
            ? Number(((totalPaidAmount / totalTreatmentAmount) * 100).toFixed(2))
            : 0

        return {
            total: totalInvoices,
            displayed: displayedInvoices,
            pending: pendingInvoices,
            paid: paidInvoices,
            totalAmount: totalTreatmentAmount,
            paidAmount: totalPaidAmount,
            pendingAmount: totalRemainingAmount,
            completionRate,
            filterSummary: filterManager.getFilterSummary(filters, patientList),
            totalTreatments,
            fullyPaidTreatments
        }
    }, [allInvoices, filteredInvoices, filters, patientList, filterManager])


    const PaginationComponent = useMemo(() => {
        if (pagination.totalPages <= 1) return null

        const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1
        const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)

        return (
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 border-t bg-gray-50 gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
                    <div className="text-sm text-gray-600">
                        Hiển thị {startItem} - {endItem} trong tổng số {pagination.totalItems} hóa đơn
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Hiển thị:</span>
                        <Select value={pagination.pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-16 sm:w-20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <SelectItem key={size} value={size.toString()}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600 hidden sm:inline">mục</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
                        className="hidden sm:flex"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(3, pagination.totalPages) }, (_, i) => {
                            let pageNumber
                            if (pagination.totalPages <= 3) {
                                pageNumber = i + 1
                            } else if (pagination.currentPage <= 2) {
                                pageNumber = i + 1
                            } else if (pagination.currentPage >= pagination.totalPages - 1) {
                                pageNumber = pagination.totalPages - 2 + i
                            } else {
                                pageNumber = pagination.currentPage - 1 + i
                            }

                            return (
                                <Button
                                    key={pageNumber}
                                    variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNumber)}
                                    className="w-8 h-8 p-0 text-xs sm:text-sm"
                                >
                                    {pageNumber}
                                </Button>
                            )
                        })}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="hidden sm:flex"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        )
    }, [pagination, handlePageChange, handlePageSizeChange])

    const InvoicePageContent = useMemo(() => (
        <Card className="w-full max-w-full sm:max-w-7xl mx-auto my-4 sm:my-8 shadow-lg rounded-lg">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b space-y-4 sm:space-y-0">
                <div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">
                        Danh sách hóa đơn
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                        Quản lý và theo dõi các hóa đơn thanh toán điều trị
                    </CardDescription>
                </div>
                <div className="text-left sm:text-right space-y-1 w-full sm:w-auto">
                    <div className="text-sm text-gray-600">
                        Tổng giá trị: <span className="font-semibold text-green-600">
                            {formatCurrency(invoiceStats.totalAmount)}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Đã lên hóa đơn: <span className="font-semibold text-blue-600">
                            {formatCurrency(invoiceStats.paidAmount)}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Tỷ lệ hoàn thành: <span className="font-semibold text-purple-600">
                            {invoiceStats.completionRate}%
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6">
                {filterErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="text-red-700 text-sm">
                            {filterErrors.map((error, index) => (
                                <div key={index}>• {error}</div>
                            ))}
                        </div>
                    </div>
                )}

                <InvoiceFilterForm
                    filters={filters}
                    patientList={patientList}
                    handleFilterChange={handleFilterChange}
                    clearFilters={clearFilters}
                    hidePatientSelect={hidePatientSelect}
                    isLoading={isLoading || isFilterLoading}
                />

                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-sm text-gray-600 font-medium">
                        Tổng số {invoiceStats.total} hóa đơn, hiển thị {invoiceStats.displayed} hóa đơn
                        {isFilterLoading && <span className="ml-2 text-blue-600">đang lọc...</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-4 text-sm">
                        <span className="text-yellow-600">
                            Chờ thanh toán: {invoiceStats.pending}
                        </span>
                        <span className="text-green-600">
                            Đã thanh toán: {invoiceStats.paid}
                        </span>
                    </div>
                </div>

                <InvoiceTable
                    displayData={paginatedData}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    getTransactionTypeBadge={getTransactionTypeBadge}
                    openInvoiceDetail={openInvoiceDetail}
                    onUpdateInvoice={handleOpenUpdateModal}
                    isLoading={isLoading}
                />

                {PaginationComponent}
            </CardContent>

            <InvoiceDetailModal
                isDetailOpen={isDetailOpen}
                setIsDetailOpen={setIsDetailOpen}
                selectedInvoice={selectedInvoice}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                getTransactionTypeBadge={getTransactionTypeBadge}
            />

            <UpdateInvoiceModal
                updateOpen={isUpdateModalOpen}
                setUpdateOpen={handleCloseUpdateModal}
                invoice={invoiceToUpdate}
                onUpdateInvoice={handleUpdateInvoice}
                isUpdating={isUpdating}
            />
        </Card>
    ), [
        filters, patientList, handleFilterChange, clearFilters, hidePatientSelect,
        isLoading, isFilterLoading, invoiceStats, paginatedData, formatCurrency,
        formatDate, getStatusBadge, getTransactionTypeBadge, openInvoiceDetail,
        isDetailOpen, selectedInvoice, PaginationComponent, filterErrors,
        isUpdateModalOpen, invoiceToUpdate, handleOpenUpdateModal,
        handleCloseUpdateModal, handleUpdateInvoice, isUpdating
    ])

    return (
        <AuthGuard requiredRoles={["Receptionist", "Owner", "Patient"]}>
            {isPatient ? (
                <PatientLayout userInfo={userInfo}>
                    {InvoicePageContent}
                </PatientLayout>
            ) : (
                <StaffLayout userInfo={userInfo}>
                    {InvoicePageContent}
                </StaffLayout>
            )}
        </AuthGuard>
    )
}