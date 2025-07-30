import { Button } from "@/components/ui/button2"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Percent, Eye, Power, PowerOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Procedure } from "@/types/procedure"
import { formatCurrency } from "@/utils/currencyUtils"

interface ProcedureTableProps {
    procedures: Procedure[]
    isLoading: boolean
    onEdit: (procedure: Procedure) => void
    onToggleActive: (procedureId: number, isActive: boolean) => void
    onViewDetails: (procedure: Procedure) => void
    onClearFilters: () => void
    totalProcedures: number
    canEdit: boolean
}

export function ProcedureTable({
    procedures,
    isLoading,
    onEdit,
    onToggleActive,
    onViewDetails,
    onClearFilters,
    totalProcedures,
    canEdit,
}: ProcedureTableProps) {

    if (isLoading) {
        return (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên Thủ Thuật</TableHead>
                            <TableHead>Giá Bán</TableHead>
                            <TableHead>Giảm Giá</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead className="text-right">Thao Tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Skeleton className="h-4 w-40" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-6 w-16 rounded-full" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-16" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <>
            <div className="shadow-md rounded-lg overflow-x-auto bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tên Thủ Thuật</TableHead>
                            <TableHead>Giá Bán</TableHead>
                            <TableHead>Giảm Giá</TableHead>
                            <TableHead>Trạng Thái</TableHead>
                            <TableHead className="text-right">Thao Tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y">
                        {procedures.map((procedure, index) => (
                            <TableRow
                                key={procedure.procedureId}
                                className={`${index % 2 === 0 ? "bg-white" : "bg-muted/50"} hover:bg-muted/30 transition-colors`}
                            >
                                <TableCell>
                                    <div>
                                        <div className="font-medium">{procedure.procedureName}</div>
                                        <div className="text-sm text-muted-foreground line-clamp-1">{procedure.description}</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">{formatCurrency(procedure.price)}</span>
                                        </div>
                                        {procedure.originalPrice !== procedure.price && (
                                            <div className="text-xs text-muted-foreground line-through">
                                                {formatCurrency(procedure.originalPrice)}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {procedure.discount > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Percent className="w-4 h-4 text-red-600" />
                                            <span className="text-red-600 font-medium">{procedure.discount}</span>
                                        </div>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={procedure.isDeleted !== true ? "default" : "destructive"}
                                        className={procedure.isDeleted === true ? "bg-red-100 text-red-800 border-red-300" : ""}
                                    >
                                        {procedure.isDeleted !== true ? "Hoạt động" : "Không hoạt động"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="default" size="sm" onClick={() => onViewDetails(procedure)}>
                                            <Eye className="w-4 h-4" />
                                        </Button>

                                        {canEdit && (
                                            <>
                                                <Button variant="outline" size="sm" onClick={() => onEdit(procedure)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                {procedure.isDeleted !== true ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onToggleActive(procedure.procedureId, false)}
                                                        className="text-orange-600 hover:text-orange-600"
                                                    >
                                                        <PowerOff className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onToggleActive(procedure.procedureId, true)}
                                                        className="text-green-600 hover:text-green-600"
                                                    >
                                                        <Power className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {procedures.length === 0 && totalProcedures > 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Không có thủ thuật nào phù hợp với tiêu chí tìm kiếm.</p>
                    <Button variant="outline" className="mt-2 bg-transparent" onClick={onClearFilters}>
                        Xóa Bộ Lọc
                    </Button>
                </div>
            )}

            {totalProcedures === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Chưa có thủ thuật nào. Tạo thủ thuật đầu tiên để bắt đầu.</p>
                </div>
            )}
        </>
    )
}