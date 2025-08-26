import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { FileText, Package, Calendar, User, Clock } from "lucide-react"
import type { Procedure } from "@/types/procedure"
import { formatCurrency } from "@/utils/currencyUtils"

interface ProcedureDetailModalProps {
    procedure: Procedure | null
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onEdit?: (procedure: Procedure) => void
    role?: string
}

export function ProcedureDetailModal({ procedure, isOpen, onOpenChange, onEdit, role }: ProcedureDetailModalProps) {
    if (!procedure) return null

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Chưa cập nhật"
        return new Date(dateString).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatDuration = (minutes?: number) => {
        if (!minutes) return "Chưa xác định"
        if (minutes < 60) {
            return `${minutes} phút`
        }
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}p` : `${hours} giờ`
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogOverlay className="bg-white/80" />
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Chi Tiết Thủ Thuật
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">Thông tin chi tiết về thủ thuật y tế</p>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold">{procedure.procedureName}</h2>
                            <Badge variant={procedure.isDeleted !== true ? "default" : "destructive"}>
                                {procedure.isDeleted !== true ? "Hoạt động" : "Không hoạt động"}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{procedure.description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            Thông Tin Giá Cả
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">Giá Gốc</span>
                                </div>
                                <p className="text-xl font-bold text-blue-600">{formatCurrency(procedure.originalPrice)}</p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">Giá Bán</span>
                                </div>
                                <p className="text-xl font-bold text-green-600">{formatCurrency(procedure.price)}</p>
                            </div>

                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package className="w-4 h-4 text-orange-600" />
                                    <span className="text-sm font-medium">Chi Phí Vật Tư</span>
                                </div>
                                <p className="text-xl font-bold text-orange-600">{formatCurrency(procedure.consumableCost)}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Thông Tin Bổ Sung</h3>

                            <div className="space-y-3">
                                {procedure.duration && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="text-sm font-medium">Thời Gian Thực Hiện</p>
                                            <p className="text-sm text-muted-foreground">{formatDuration(procedure.duration)}</p>
                                        </div>
                                    </div>
                                )}

                                {procedure.requirements && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Yêu Cầu & Chuẩn Bị</p>
                                        <div className="bg-muted/50 p-3 rounded-md">
                                            <p className="text-sm text-muted-foreground">{procedure.requirements}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Thông Tin Hệ Thống</h3>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <div>
                                        <p className="text-sm font-medium">Ngày Tạo</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(procedure.createdAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">Cập Nhật Lần Cuối</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(procedure.updatedAt)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-600" />
                                    <div>
                                        <p className="text-sm font-medium">Người Tạo</p>
                                        <p className="text-sm text-muted-foreground">{procedure.createdBy || "Không xác định"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-600" />
                                    <div>
                                        <p className="text-sm font-medium">Người Cập Nhật</p>
                                        <p className="text-sm text-muted-foreground">{procedure.updatedBy || "Không xác định"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {procedure.suppliesUsed && procedure.suppliesUsed.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    Vật Tư Sử Dụng
                                    <Badge variant="secondary" className="ml-2">
                                        {procedure.suppliesUsed.length} vật tư
                                    </Badge>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {procedure.suppliesUsed.map((supply, index) => (
                                        <div key={index} className="p-4 border rounded-lg bg-muted/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{supply.supplyName}</h4>
                                                    </div>
                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                        Số lượng: <span className="font-medium">{supply.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-blue-800">Tổng số loại vật tư:</span>
                                        <span className="font-bold text-blue-800">{procedure.suppliesUsed.length}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <Separator />

                    <div className="flex justify-end gap-2">
                        {role === "Assistant" && onEdit && (
                            <Button onClick={() => onEdit(procedure)}>Chỉnh Sửa</Button>
                        )}
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Đóng
                        </Button>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}