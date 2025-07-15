import * as React from "react"
import { CalendarDays, Check, ChevronsUpDown, X, Filter, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Patient } from "@/types/patient"

interface InvoiceFilterFormProps {
    filters: {
        status: string
        fromDate: string
        toDate: string
        patientId: string
    }
    patientList: Patient[]
    handleFilterChange: (key: string, value: string) => void
    clearFilters: () => void
    hidePatientSelect: boolean
    isLoading?: boolean
}

// Status options configuration
const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả", color: "bg-gray-100 text-gray-700" },
    { value: "pending", label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700" },
    { value: "paid", label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
] as const

// Date validation helper
const isValidDateRange = (fromDate: string, toDate: string): boolean => {
    if (!fromDate || !toDate) return true
    return new Date(fromDate) <= new Date(toDate)
}

// Get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0]
}

// Get date 30 days ago
const getDateDaysAgo = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
}

// Quick filter presets - Define the type separately
type QuickFilterPreset = {
    label: string
    fromDate: string
    toDate: string
}

const QUICK_FILTERS: QuickFilterPreset[] = [
    { label: "Hôm nay", fromDate: getTodayDate(), toDate: getTodayDate() },
    { label: "7 ngày qua", fromDate: getDateDaysAgo(7), toDate: getTodayDate() },
    { label: "30 ngày qua", fromDate: getDateDaysAgo(30), toDate: getTodayDate() },
    { label: "90 ngày qua", fromDate: getDateDaysAgo(90), toDate: getTodayDate() },
]

export function InvoiceFilterForm({ 
    filters, 
    patientList, 
    handleFilterChange, 
    clearFilters, 
    hidePatientSelect,
    isLoading = false
}: InvoiceFilterFormProps) {
    const [patientSelectOpen, setPatientSelectOpen] = React.useState(false)
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [dateRangeError, setDateRangeError] = React.useState<string | null>(null)

    // Validate date range whenever dates change
    React.useEffect(() => {
        if (filters.fromDate && filters.toDate) {
            if (!isValidDateRange(filters.fromDate, filters.toDate)) {
                setDateRangeError("Ngày bắt đầu phải trước ngày kết thúc")
            } else {
                setDateRangeError(null)
            }
        } else {
            setDateRangeError(null)
        }
    }, [filters.fromDate, filters.toDate])

    // Handle date change with validation
    const handleDateChange = React.useCallback((key: string, value: string) => {
        handleFilterChange(key, value)
    }, [handleFilterChange])

    // Apply quick filter preset - Use the explicit type
    const applyQuickFilter = React.useCallback((preset: QuickFilterPreset) => {
        handleFilterChange("fromDate", preset.fromDate)
        handleFilterChange("toDate", preset.toDate)
    }, [handleFilterChange])

    // Count active filters
    const activeFiltersCount = React.useMemo(() => {
        let count = 0
        if (filters.status && filters.status !== "all") count++
        if (filters.fromDate) count++
        if (filters.toDate) count++
        if (filters.patientId && !hidePatientSelect) count++
        return count
    }, [filters, hidePatientSelect])

    // Get selected patient name
    const selectedPatientName = React.useMemo(() => {
        if (!filters.patientId) return null
        const patient = patientList.find(p => p.patientId.toString() === filters.patientId)
        return patient?.fullname || null
    }, [filters.patientId, patientList])

    // Get selected status label
    const selectedStatusLabel = React.useMemo(() => {
        const status = STATUS_OPTIONS.find(s => s.value === filters.status)
        return status?.label || "Tất cả"
    }, [filters.status])

    return (
        <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-700">Bộ lọc tìm kiếm</h3>
                    </div>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {activeFiltersCount} bộ lọc đang áp dụng
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFiltersCount > 0 && (
                        <Button
                            onClick={clearFilters}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4 mr-1" />
                            Xóa bộ lọc
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600"
                    >
                        {isCollapsed ? "Mở rộng" : "Thu gọn"}
                        <ChevronsUpDown className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Filters Summary (always visible) */}
            {activeFiltersCount > 0 && (
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-blue-700 font-medium">Đang lọc:</span>
                        {filters.status && filters.status !== "all" && (
                            <Badge variant="outline" className="bg-white">
                                Trạng thái: {selectedStatusLabel}
                            </Badge>
                        )}
                        {filters.fromDate && (
                            <Badge variant="outline" className="bg-white">
                                Từ: {new Date(filters.fromDate).toLocaleDateString("vi-VN")}
                            </Badge>
                        )}
                        {filters.toDate && (
                            <Badge variant="outline" className="bg-white">
                                Đến: {new Date(filters.toDate).toLocaleDateString("vi-VN")}
                            </Badge>
                        )}
                        {filters.patientId && !hidePatientSelect && selectedPatientName && (
                            <Badge variant="outline" className="bg-white">
                                Bệnh nhân: {selectedPatientName}
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {/* Filter Controls */}
            {!isCollapsed && (
                <div className="p-5">
                    {/* Quick Filter Buttons */}
                    <div className="mb-6">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Bộ lọc nhanh
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_FILTERS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickFilter(preset)}
                                    disabled={isLoading}
                                    className="text-xs hover:bg-blue-50 hover:border-blue-300"
                                >
                                    {preset.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator className="mb-6" />

                    {/* Main Filter Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                                Trạng thái
                            </Label>
                            <Select 
                                value={filters.status} 
                                onValueChange={(value) => handleFilterChange("status", value)}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* From Date Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="fromDate" className="text-sm font-medium text-gray-700">
                                Từ ngày
                            </Label>
                            <div className="relative">
                                <Input
                                    id="fromDate"
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleDateChange("fromDate", e.target.value)}
                                    className={cn(
                                        "pr-10",
                                        dateRangeError && "border-red-500 focus:border-red-500"
                                    )}
                                    disabled={isLoading}
                                    max={getTodayDate()}
                                />
                                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* To Date Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="toDate" className="text-sm font-medium text-gray-700">
                                Đến ngày
                            </Label>
                            <div className="relative">
                                <Input
                                    id="toDate"
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleDateChange("toDate", e.target.value)}
                                    className={cn(
                                        "pr-10",
                                        dateRangeError && "border-red-500 focus:border-red-500"
                                    )}
                                    disabled={isLoading}
                                    min={filters.fromDate || undefined}
                                    max={getTodayDate()}
                                />
                                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Patient Filter */}
                        {!hidePatientSelect && (
                            <div className="space-y-2">
                                <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">
                                    Bệnh nhân
                                </Label>
                                <Popover open={patientSelectOpen} onOpenChange={setPatientSelectOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={patientSelectOpen}
                                            className="w-full justify-between bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            disabled={isLoading}
                                        >
                                            <span className="truncate">
                                                {filters.patientId
                                                    ? selectedPatientName || "Bệnh nhân không tồn tại"
                                                    : "Chọn bệnh nhân..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                        <Command>
                                            <CommandInput 
                                                placeholder="Tìm kiếm bệnh nhân..." 
                                                className="h-9"
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    <div className="flex flex-col items-center py-4">
                                                        <Search className="h-8 w-8 text-gray-400 mb-2" />
                                                        <span className="text-sm text-gray-500">
                                                            Không tìm thấy bệnh nhân
                                                        </span>
                                                    </div>
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="clear-patient-filter"
                                                        onSelect={() => {
                                                            handleFilterChange("patientId", "")
                                                            setPatientSelectOpen(false)
                                                        }}
                                                        className="text-red-600 hover:bg-red-50"
                                                    >
                                                        <X className="mr-2 h-4 w-4" />
                                                        <span>Xóa lựa chọn</span>
                                                    </CommandItem>
                                                    {patientList.map((patient) => (
                                                        <CommandItem
                                                            key={patient.patientId}
                                                            value={`${patient.fullname} ${patient.patientId} ${patient.phone}`}
                                                            onSelect={() => {
                                                                handleFilterChange("patientId", patient.patientId.toString())
                                                                setPatientSelectOpen(false)
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    filters.patientId === patient.patientId.toString() 
                                                                        ? "opacity-100" : "opacity-0",
                                                                )}
                                                            />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="font-medium text-sm truncate">
                                                                    {patient.fullname}
                                                                </span>
                                                                <span className="text-xs text-gray-500 truncate">
                                                                    ID: {patient.patientId} • {patient.phone}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        )}
                    </div>

                    {/* Date Range Error */}
                    {dateRangeError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700">
                                <X className="h-4 w-4" />
                                <span className="text-sm font-medium">{dateRangeError}</span>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Đang lọc dữ liệu...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}