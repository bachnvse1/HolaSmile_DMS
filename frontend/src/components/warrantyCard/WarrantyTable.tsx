import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, AlertCircle, CheckCircle2 } from "lucide-react"
import type { WarrantyCard } from "@/types/warranty"
import { formatDateShort } from "@/utils"

interface WarrantyTableProps {
  cards: WarrantyCard[]
  onEdit: (card: WarrantyCard) => void
  onToggleStatus: (cardId: number) => void
}

export function WarrantyTable({ cards, onEdit, onToggleStatus }: WarrantyTableProps) {

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Danh sách thẻ bảo hành</CardTitle>
        <CardDescription>Xem chi tiết tất cả thẻ bảo hành dưới dạng bảng</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {/* Mobile Table View */}
        <div className="block sm:hidden">
          {cards.map((card) => (
            <div key={card.warrantyCardId} className="border-b p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">#{card.warrantyCardId}</div>
                <Badge className={`${getStatusColor(card.status)} text-xs`}>
                  {card.status ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Bệnh nhân: </span>
                  <span className="font-medium">{card.patientName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Thủ thuật: </span>
                  <span>{card.procedureName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Bắt đầu: </span>
                    <span>{formatDateShort(card.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Kết thúc: </span>
                    <span>{formatDateShort(card.endDate)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Thời hạn: </span>
                  <span>{card.duration} tháng</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="ghost" size="sm" onClick={() => onEdit(card)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </Button>
                <Button
                  variant={card.status ? "destructive" : "default"}
                  size="sm"
                  onClick={() => onToggleStatus(card.warrantyCardId)}
                  className={
                    card.status
                      ? "bg-red-500 hover:bg-red-600 text-white text-xs px-2"
                      : "bg-green-500 hover:bg-green-600 text-white text-xs px-2"
                  }
                >
                  {card.status ? (
                    <>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Vô hiệu hóa
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Kích hoạt
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã số</TableHead>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Thủ thuật</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày kết thúc</TableHead>
                <TableHead>Thời hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.warrantyCardId}>
                  <TableCell className="font-medium">#{card.warrantyCardId}</TableCell>
                  <TableCell>{card.patientName}</TableCell>
                  <TableCell>{card.procedureName}</TableCell>
                  <TableCell>{formatDateShort(card.startDate)}</TableCell>
                  <TableCell>{formatDateShort(card.endDate)}</TableCell>
                  <TableCell>{card.duration} tháng</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(card.status)}>
                      {card.status ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEdit(card)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={card.status ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onToggleStatus(card.warrantyCardId)}
                        className={
                          card.status
                            ? "bg-red-500 hover:bg-red-600 text-white text-xs px-2"
                            : "bg-green-500 hover:bg-green-600 text-white text-xs px-2"
                        }
                      >
                        {card.status ? (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Tắt
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Bật
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
