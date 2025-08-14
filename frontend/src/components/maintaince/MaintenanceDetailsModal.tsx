import { useEffect, useState, useCallback, useMemo } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    Calendar,
    FileText,
    Package,
    RefreshCw,
    AlertCircle,
    CheckCircle
} from "lucide-react"
import { getMaintenanceDetails } from "@/services/maintenanceService"
import { toast } from "react-toastify"
import { formatCurrency as formatCurrencyUtils } from "@/utils/currencyUtils"

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

interface MaintenanceDetailsModalProps {
    maintenanceId: number | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
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

const STATUS_CONFIG = {
    Pending: {
        label: "Đang chờ phê duyệt",
        variant: "warning" as const,
        icon: AlertCircle,
        color: "text-yellow-600"
    },
    Approved: {
        label: "Đã phê duyệt",
        variant: "success" as const,
        icon: CheckCircle,
        color: "text-green-600"
    }
} as const

const handleApiError = (error: unknown, defaultMessage: string): void => {
    const apiError = error as ApiError

    if (apiError?.response?.data?.code === 'MAINTENANCE_NOT_FOUND') {
        toast.error("phiếu bảo trì không tồn tại hoặc đã bị xóa.")
        return
    }

    const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        defaultMessage
    toast.error(message)
}

const mapApiRecord = (api: any): MaintenanceRecord | null => {
    try {
        const maintenanceId = api.maintenanceId ?? api.MaintenanceId ?? api.id ?? api.ID
        if (!maintenanceId) {
            return null
        }

        return {
            maintenanceId: Number(maintenanceId),
            maintenancedate: api.maintenanceDate ?? api.MaintenanceDate ?? api.maintenancedate ?? api.createdAt ?? new Date().toISOString(),
            description: api.description ?? api.Description ?? "",
            status: normalizeStatus(api.status ?? api.Status ?? "Pending"),
            price: Number(api.price ?? api.Price ?? 0),
            supplies: mapSupplies(api.supplies ?? api.Supplies ?? []),
            createdAt: api.createdAt ?? api.CreatedAt,
            updatedAt: api.updatedAt ?? api.UpdatedAt
        }
    } catch (error) {
        console.error("Error mapping API record:", error, api)
        return null
    }
}

const normalizeStatus = (status: any): MaintenanceStatus => {
    const statusStr = String(status ?? "").toLowerCase()
    return statusStr === "approved" || statusStr === "đã phê duyệt"
        ? "Approved"
        : "Pending"
}

const mapSupplies = (apiSupplies: any[]): Supply[] => {
    if (!Array.isArray(apiSupplies)) return []

    const result: Supply[] = []
    for (const s of apiSupplies) {
        try {
            const item: Supply = {
                supplyId: Number(s.supplyId ?? s.SupplyID ?? s.id ?? s.ID),
                name: String(s.name ?? s.Name ?? ""),
                unit: String(s.unit ?? s.Unit ?? ""),
                price: Number(s.price ?? s.Price ?? 0),
                expiryDate: s.expiryDate ?? s.ExpiryDate ?? null,
            }
            result.push(item)
        } catch (err) {
            console.warn("Error mapping supply:", err, s)
        }
    }
    return result
}

const formatCurrency = (value: number | string) => {
    const out = formatCurrencyUtils(value as any)
    return `${out === "" ? "0" : out} VND`
}

const formatDate = (dateString: string): string => {
    try {
        return format(new Date(dateString), "dd/MM/yyyy 'lúc' HH:mm", { locale: vi })
    } catch (error) {
        console.warn("Error formatting date:", error, dateString)
        return "Ngày không hợp lệ"
    }
}

const formatDateOnly = (dateString: string): string => {
    try {
        return format(new Date(dateString), "dd/MM/yyyy", { locale: vi })
    } catch (error) {
        console.warn("Error formatting date:", error, dateString)
        return "N/A"
    }
}

export function MaintenanceDetailsModal({
    maintenanceId,
    isOpen,
    onOpenChange
}: MaintenanceDetailsModalProps) {
    const [record, setRecord] = useState<MaintenanceRecord | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadRecord = useCallback(async (id: number) => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await getMaintenanceDetails(id)
            const mappedRecord = data ? mapApiRecord(data) : null

            if (!mappedRecord) {
                setError("Không thể tải thông tin chi tiết bảo trì.")
                setRecord(null)
                return
            }

            setRecord(mappedRecord)
        } catch (error) {
            const errorMessage = "Không thể tải chi tiết bảo trì."
            setError(errorMessage)
            setRecord(null)
            handleApiError(error, errorMessage)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen && maintenanceId !== null) {
            loadRecord(maintenanceId)
        } else {
            setRecord(null)
            setError(null)
            setIsLoading(false)
        }
    }, [maintenanceId, isOpen, loadRecord])

    const handleRetry = useCallback(() => {
        if (maintenanceId !== null) {
            loadRecord(maintenanceId)
        }
    }, [maintenanceId, loadRecord])

    const statusConfig = useMemo(() => {
        return record ? STATUS_CONFIG[record.status] : null
    }, [record])

    const totalSupplyValue = useMemo(() => {
        if (!record?.supplies.length) return 0
        return record.supplies.reduce((total, supply) => total + supply.price, 0)
    }, [record?.supplies])

    const isExpiringSoon = useCallback((expiryDate?: string | null): boolean => {
        if (!expiryDate) return false
        const today = new Date()
        const expiry = new Date(expiryDate)
        const daysDiff = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 30 && daysDiff >= 0
    }, [])

    const isExpired = useCallback((expiryDate?: string | null): boolean => {
        if (!expiryDate) return false
        return new Date(expiryDate) < new Date()
    }, [])

    const renderLoadingState = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
                <p className="text-lg font-medium">Đang tải chi tiết...</p>
                <p className="text-sm text-muted-foreground">Vui lòng đợi trong giây lát</p>
            </div>
        </div>
    )

    const renderErrorState = () => (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-red-600">Có lỗi xảy ra</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Thử lại
                </Button>
            </div>
        </div>
    )

    const renderSupplyCard = (supply: Supply) => {
        const isExpiringSoonFlag = isExpiringSoon(supply.expiryDate)
        const isExpiredFlag = isExpired(supply.expiryDate)

        return (
            <Card key={supply.supplyId} className="relative">
                {(isExpiredFlag || isExpiringSoonFlag) && (
                    <div className="absolute top-2 right-2">
                        <Badge
                            variant={isExpiredFlag ? "destructive" : "warning"}
                            className="text-xs"
                        >
                            {isExpiredFlag ? "Hết hạn" : "Sắp hết hạn"}
                        </Badge>
                    </div>
                )}

                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {supply.name}
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Đơn vị:</span>
                            <span className="font-medium">{supply.unit}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Giá:</span>
                            <span className="font-medium">{formatCurrency(supply.price)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Hạn sử dụng:</span>
                            <span
                                className={`font-medium ${isExpiredFlag
                                        ? "text-red-600"
                                        : isExpiringSoonFlag
                                            ? "text-yellow-600"
                                            : ""
                                    }`}
                            >
                                {supply.expiryDate ? formatDateOnly(supply.expiryDate) : "Không có"}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Chi tiết bảo trì
                    </DialogTitle>
                    <DialogDescription>
                        Thông tin chi tiết về phiếu bảo trì và vật tư sử dụng.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow pr-4">
                    {isLoading ? (
                        renderLoadingState()
                    ) : error ? (
                        renderErrorState()
                    ) : record ? (
                        <div className="space-y-6 py-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Thông tin chính</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm text-muted-foreground">Ngày bảo trì</p>
                                                <p className="font-medium">{formatDate(record.maintenancedate)}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Tổng chi phí</p>
                                                <p className="font-medium">{formatCurrency(record.price)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-muted-foreground">Trạng thái:</p>
                                            {statusConfig && (
                                                <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                                                    <statusConfig.icon className="h-3 w-3" />
                                                    {statusConfig.label}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Mô tả:</p>
                                        <p className="font-medium bg-gray-50 p-3 rounded-md">
                                            {record.description || "Không có mô tả"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Package className="h-5 w-5" />
                                            Vật tư sử dụng ({record.supplies.length})
                                        </span>
                                        {totalSupplyValue > 0 && (
                                            <Badge variant="outline">
                                                Tổng: {formatCurrency(totalSupplyValue)}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {record.supplies.length > 0 ? (
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {record.supplies.map(renderSupplyCard)}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Không có vật tư nào được sử dụng cho bảo trì này.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {(record.createdAt || record.updatedAt) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Thông tin hệ thống</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-sm">
                                        {record.createdAt && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tạo lúc:</span>
                                                <span>{formatDate(record.createdAt)}</span>
                                            </div>
                                        )}
                                        {record.updatedAt && record.updatedAt !== record.createdAt && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Cập nhật lúc:</span>
                                                <span>{formatDate(record.updatedAt)}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Không tìm thấy phiếu bảo trì.</p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
