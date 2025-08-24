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

const STATUS_OPTIONS = [
    { value: "all", label: "Tất cả", color: "bg-gray-100 text-gray-700", shortLabel: "Tất cả" },
    { value: "pending", label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700", shortLabel: "Chờ TT" },
    { value: "paid", label: "Đã thanh toán", color: "bg-green-100 text-green-700", shortLabel: "Đã TT" },
] as const

const isValidDateRange = (fromDate: string, toDate: string): boolean => {
    if (!fromDate || !toDate) return true
    return new Date(fromDate) <= new Date(toDate)
}

const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0]
}

const getDateDaysAgo = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
}

type QuickFilterPreset = {
    label: string
    shortLabel: string
    fromDate: string
    toDate: string
}

const QUICK_FILTERS: QuickFilterPreset[] = [
    { label: "Hôm nay", shortLabel: "Hôm nay", fromDate: getTodayDate(), toDate: getTodayDate() },
    { label: "7 ngày qua", shortLabel: "7 ngày", fromDate: getDateDaysAgo(7), toDate: getTodayDate() },
    { label: "30 ngày qua", shortLabel: "30 ngày", fromDate: getDateDaysAgo(30), toDate: getTodayDate() },
    { label: "90 ngày qua", shortLabel: "90 ngày", fromDate: getDateDaysAgo(90), toDate: getTodayDate() },
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

    const handleDateChange = React.useCallback((key: string, value: string) => {
        handleFilterChange(key, value)
    }, [handleFilterChange])

    const applyQuickFilter = React.useCallback((preset: QuickFilterPreset) => {
        handleFilterChange("fromDate", preset.fromDate)
        handleFilterChange("toDate", preset.toDate)
    }, [handleFilterChange])

    const activeFiltersCount = React.useMemo(() => {
        let count = 0
        if (filters.status && filters.status !== "all") count++
        if (filters.fromDate) count++
        if (filters.toDate) count++
        if (filters.patientId && !hidePatientSelect) count++
        return count
    }, [filters, hidePatientSelect])

    const selectedPatientName = React.useMemo(() => {
        if (!filters.patientId) return null
        const patient = patientList.find(p => p.patientId.toString() === filters.patientId)
        return patient?.fullname || null
    }, [filters.patientId, patientList])

    const selectedStatusInfo = React.useMemo(() => {
        const status = STATUS_OPTIONS.find(s => s.value === filters.status)
        return status || STATUS_OPTIONS[0]
    }, [filters.status])

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsCollapsed(true)
            }
        }
        
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className="mb-4 sm:mb-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mx-2 sm:mx-0">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                        <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 flex-shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold text-gray-700 truncate">
                            <span className="hidden sm:inline">Bộ lọc tìm kiếm</span>
                            <span className="sm:hidden">Bộ lọc</span>
                        </h3>
                    </div>
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {activeFiltersCount > 0 && (
                        <Button
                            onClick={clearFilters}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 p-1 sm:p-2"
                            disabled={isLoading}
                        >
                            <X className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">Xóa bộ lọc</span>
                        </Button>
                    )}
                    <Button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 p-1 sm:p-2"
                    >
                        <span className="hidden sm:inline mr-1">
                            {isCollapsed ? "Mở rộng" : "Thu gọn"}
                        </span>
                        <ChevronsUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {activeFiltersCount > 0 && (
                <div className="p-3 sm:p-4 bg-blue-50 border-b border-blue-200">
                    <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
                        <span className="text-xs sm:text-sm text-blue-700 font-medium whitespace-nowrap">
                            Đang lọc:
                        </span>
                        {filters.status && filters.status !== "all" && (
                            <Badge variant="outline" className="bg-white text-xs">
                                <span className="hidden sm:inline">Trạng thái: {selectedStatusInfo.label}</span>
                                <span className="sm:hidden">{selectedStatusInfo.shortLabel}</span>
                            </Badge>
                        )}
                        {filters.fromDate && (
                            <Badge variant="outline" className="bg-white text-xs">
                                <span className="hidden sm:inline">Từ: </span>
                                {new Date(filters.fromDate).toLocaleDateString("vi-VN")}
                            </Badge>
                        )}
                        {filters.toDate && (
                            <Badge variant="outline" className="bg-white text-xs">
                                <span className="hidden sm:inline">Đến: </span>
                                {new Date(filters.toDate).toLocaleDateString("vi-VN")}
                            </Badge>
                        )}
                        {filters.patientId && !hidePatientSelect && selectedPatientName && (
                            <Badge variant="outline" className="bg-white text-xs max-w-32 sm:max-w-none">
                                <span className="hidden sm:inline">BN: </span>
                                <span className="truncate">{selectedPatientName}</span>
                            </Badge>
                        )}
                    </div>
                </div>
            )}

            {!isCollapsed && (
                <div className="p-3 sm:p-5">
                    <div className="mb-4 sm:mb-6">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            Bộ lọc nhanh
                        </Label>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                            {QUICK_FILTERS.map((preset) => (
                                <Button
                                    key={preset.label}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickFilter(preset)}
                                    disabled={isLoading}
                                    className="text-xs hover:bg-blue-50 hover:border-blue-300 justify-center"
                                >
                                    <span className="hidden sm:inline">{preset.label}</span>
                                    <span className="sm:hidden">{preset.shortLabel}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Separator className="mb-4 sm:mb-6" />

                    <div className="space-y-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 lg:gap-6 sm:space-y-0">
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                                Trạng thái
                            </Label>
                            <Select 
                                value={filters.status} 
                                onValueChange={(value) => handleFilterChange("status", value)}
                                disabled={isLoading}
                            >
                                <SelectTrigger className="w-full h-10">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${option.color}`} />
                                                <span className="hidden sm:inline">{option.label}</span>
                                                <span className="sm:hidden">{option.shortLabel}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                        "pr-10 h-10",
                                        dateRangeError && "border-red-500 focus:border-red-500"
                                    )}
                                    disabled={isLoading}
                                    max={getTodayDate()}
                                />
                                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

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
                                        "pr-10 h-10",
                                        dateRangeError && "border-red-500 focus:border-red-500"
                                    )}
                                    disabled={isLoading}
                                    min={filters.fromDate || undefined}
                                    max={getTodayDate()}
                                />
                                <CalendarDays className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {!hidePatientSelect && (
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="patientId" className="text-sm font-medium text-gray-700">
                                    Bệnh nhân
                                </Label>
                                <Popover open={patientSelectOpen} onOpenChange={setPatientSelectOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={patientSelectOpen}
                                            className="w-full justify-between bg-white text-gray-700 border-gray-300 hover:bg-gray-50 h-10"
                                            disabled={isLoading}
                                        >
                                            <span className="truncate text-left">
                                                {filters.patientId
                                                    ? selectedPatientName || "Bệnh nhân không tồn tại"
                                                    : "Chọn bệnh nhân..."}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent 
                                        className="w-[var(--radix-popover-trigger-width)] p-0 max-w-[calc(100vw-1rem)]"
                                        align="start"
                                    >
                                        <Command>
                                            <CommandInput 
                                                placeholder="Tìm kiếm bệnh nhân..." 
                                                className="h-9"
                                            />
                                            <CommandList className="max-h-60">
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

                    {dateRangeError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-center gap-2 text-red-700">
                                <X className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm font-medium">{dateRangeError}</span>
                            </div>
                        </div>
                    )}

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