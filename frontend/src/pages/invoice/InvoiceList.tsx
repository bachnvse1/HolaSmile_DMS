import { useEffect, useState, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"
import axios from "axios"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { InvoiceFilterForm } from "@/components/invoice/InvoiceFilterForm"
import { InvoiceTable } from "@/components/invoice/InvoiceTable"
import { InvoiceDetailModal } from "@/components/invoice/InvoiceDetailModal"

import { invoiceService } from "@/services/invoiceService"
import { getAllPatients } from "@/services/patientService"
import type { Patient } from "@/types/patient"
import type { Invoice } from "@/types/invoice"
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { PatientLayout } from "@/layouts/patient"

// Constants for better maintainability
const INVOICE_STATUS_CONFIG = {
    pending: { label: "Chờ thanh toán", variant: "secondary" as const },
    paid: { label: "Đã thanh toán", variant: "default" as const },
} as const

const TRANSACTION_TYPE_CONFIG = {
    full: { label: "Toàn bộ", variant: "default" as const },
    partial: { label: "Một phần", variant: "outline" as const },
} as const

// Pagination constants
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const DEFAULT_PAGE_SIZE = 10

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

export default function InvoiceList() {
    const userInfo = useUserInfo()

    // State management
    const [filters, setFilters] = useState<InvoiceFilters>({
        status: "",
        fromDate: "",
        toDate: "",
        patientId: "",
    })

    const [invoiceData, setInvoiceData] = useState<Invoice[]>([])
    const [displayData, setDisplayData] = useState<Invoice[]>([])
    const [paginatedData, setPaginatedData] = useState<Invoice[]>([])
    const [patientList, setPatientList] = useState<Patient[]>([])
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)

    // Pagination state
    const [pagination, setPagination] = useState<PaginationState>({
        currentPage: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalItems: 0,
    })

    // Memoized values
    const isPatient = useMemo(() => userInfo?.role === "Patient", [userInfo?.role])
    const isReceptionist = useMemo(() => userInfo?.role === "Receptionist", [userInfo?.role])
    const hidePatientSelect = useMemo(() => isPatient, [isPatient])

    // Initialize patient-specific filters
    useEffect(() => {
        if (isPatient && userInfo?.roleTableId) {
            setFilters(prev => ({ 
                ...prev, 
                patientId: userInfo.roleTableId.toString() 
            }))
        }
    }, [isPatient, userInfo?.roleTableId])

    // Fetch initial data
    useEffect(() => {
        if (!userInfo?.role || isInitialized) return
        
        fetchInitialData()
        setIsInitialized(true)
    }, [userInfo?.role, isInitialized])

    // Update pagination when displayData changes
    useEffect(() => {
        updatePagination()
    }, [displayData, pagination.pageSize, pagination.currentPage])

    // Update paginated data when pagination changes
    useEffect(() => {
        updatePaginatedData()
    }, [displayData, pagination.currentPage, pagination.pageSize])

    // Pagination utility functions
    const updatePagination = useCallback(() => {
        const totalItems = displayData.length
        const totalPages = Math.ceil(totalItems / pagination.pageSize)
        
        setPagination(prev => ({
            ...prev,
            totalItems,
            totalPages,
            currentPage: Math.min(prev.currentPage, totalPages || 1)
        }))
    }, [displayData.length, pagination.pageSize])

    const updatePaginatedData = useCallback(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize
        const endIndex = startIndex + pagination.pageSize
        setPaginatedData(displayData.slice(startIndex, endIndex))
    }, [displayData, pagination.currentPage, pagination.pageSize])

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

    // Optimized data fetching with proper error handling
    const fetchInitialData = useCallback(async () => {
        if (!userInfo?.role) return

        setIsLoading(true)
        try {
            if (isPatient && userInfo.roleTableId) {
                const invoices = await invoiceService.getInvoices({ 
                    patientId: userInfo.roleTableId 
                })
                setInvoiceData(invoices)
                setDisplayData(invoices)
            } else if (isReceptionist) {
                const [invoices, patients] = await Promise.all([
                    invoiceService.getInvoices({}),
                    getAllPatients(),
                ])
                setInvoiceData(invoices)
                setDisplayData(invoices)
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

    // Optimized filter handling with debouncing effect
    const handleFilterChange = useCallback(async (key: string, value: string) => {
        const newFilters: InvoiceFilters = {
            ...filters,
            [key]: value,
            ...(isPatient && userInfo?.roleTableId ? { 
                patientId: userInfo.roleTableId.toString() 
            } : {})
        }
        
        setFilters(newFilters)
        
        try {
            setIsLoading(true)
            const filtered = await invoiceService.getInvoices(newFilters)
            setDisplayData(filtered)
            // Reset to first page when filters change
            setPagination(prev => ({ ...prev, currentPage: 1 }))
        } catch (error) {
            toast.error("Lỗi khi lọc hóa đơn")
            console.error("Error filtering invoices:", error)
        } finally {
            setIsLoading(false)
        }
    }, [filters, isPatient, userInfo?.roleTableId])

    // Optimized clear filters function
    const clearFilters = useCallback(async () => {
        const emptyFilters: InvoiceFilters = {
            status: "",
            fromDate: "",
            toDate: "",
            patientId: isPatient && userInfo?.roleTableId ? 
                userInfo.roleTableId.toString() : "",
        }
        
        setFilters(emptyFilters)
        
        try {
            setIsLoading(true)
            const data = await invoiceService.getInvoices(emptyFilters)
            setDisplayData(data)
            // Reset to first page when filters are cleared
            setPagination(prev => ({ ...prev, currentPage: 1 }))
        } catch (error) {
            toast.error("Không thể tải lại danh sách hóa đơn")
            console.error("Error clearing filters:", error)
        } finally {
            setIsLoading(false)
        }
    }, [isPatient, userInfo?.roleTableId])

    // Memoized utility functions
    const formatCurrency = useCallback((amount: number | null): string => {
        if (amount === null || amount === undefined) return "N/A"
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
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

    // Memoized invoice statistics
    const invoiceStats = useMemo(() => ({
        total: invoiceData.length,
        displayed: displayData.length,
        pending: displayData.filter(invoice => invoice.status === 'pending').length,
        paid: displayData.filter(invoice => invoice.status === 'paid').length,
        totalAmount: displayData.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0),
        paidAmount: displayData.reduce((sum, invoice) => sum + (invoice.paidAmount || 0), 0),
    }), [invoiceData.length, displayData])

    // Memoized pagination component
    const PaginationComponent = useMemo(() => {
        if (pagination.totalPages <= 1) return null

        const startItem = (pagination.currentPage - 1) * pagination.pageSize + 1
        const endItem = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)

        return (
            <div className="flex items-center justify-between px-2 py-4 border-t">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-600">
                        Hiển thị {startItem} - {endItem} trong tổng số {pagination.totalItems} hóa đơn
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Hiển thị:</span>
                        <Select value={pagination.pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-20">
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
                        <span className="text-sm text-gray-600">mục</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={pagination.currentPage === 1}
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
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            let pageNumber
                            if (pagination.totalPages <= 5) {
                                pageNumber = i + 1
                            } else if (pagination.currentPage <= 3) {
                                pageNumber = i + 1
                            } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                pageNumber = pagination.totalPages - 4 + i
                            } else {
                                pageNumber = pagination.currentPage - 2 + i
                            }

                            return (
                                <Button
                                    key={pageNumber}
                                    variant={pagination.currentPage === pageNumber ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(pageNumber)}
                                    className="w-8 h-8 p-0"
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
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        )
    }, [pagination, handlePageChange, handlePageSizeChange])

    // Memoized invoice page component
    const InvoicePageContent = useMemo(() => (
        <Card className="w-full max-w-7xl mx-auto my-8 shadow-lg rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between p-6 bg-gray-50 border-b">
                <div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        Danh sách hóa đơn
                    </CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                        Quản lý và theo dõi các hóa đơn thanh toán điều trị
                    </CardDescription>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-600">
                        Tổng giá trị: <span className="font-semibold text-green-600">
                            {formatCurrency(invoiceStats.totalAmount)}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Đã thanh toán: <span className="font-semibold text-blue-600">
                            {formatCurrency(invoiceStats.paidAmount)}
                        </span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <InvoiceFilterForm
                    filters={filters}
                    patientList={patientList}
                    handleFilterChange={handleFilterChange}
                    clearFilters={clearFilters}
                    hidePatientSelect={hidePatientSelect}
                    isLoading={isLoading}
                />
                
                <div className="mb-4 flex justify-between items-center">
                    <div className="text-sm text-gray-600 font-medium">
                        Tổng số {invoiceStats.total} hóa đơn, lọc được {invoiceStats.displayed} hóa đơn
                    </div>
                    <div className="flex gap-4 text-sm">
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
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    getTransactionTypeBadge={getTransactionTypeBadge}
                    openInvoiceDetail={openInvoiceDetail}
                    isLoading={isLoading}
                />

                {PaginationComponent}
            </CardContent>

            <InvoiceDetailModal
                isDetailOpen={isDetailOpen}
                setIsDetailOpen={setIsDetailOpen}
                selectedInvoice={selectedInvoice}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getStatusBadge={getStatusBadge}
                getTransactionTypeBadge={getTransactionTypeBadge}
            />
        </Card>
    ), [
        filters, patientList, handleFilterChange, clearFilters, hidePatientSelect,
        isLoading, invoiceStats, paginatedData, formatCurrency, formatDate,
        getStatusBadge, getTransactionTypeBadge, openInvoiceDetail,
        isDetailOpen, selectedInvoice, PaginationComponent
    ])

    return (
        <AuthGuard requiredRoles={["Receptionist", "Patient"]}>
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