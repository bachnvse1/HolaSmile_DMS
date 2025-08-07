import { Button } from "@/components/ui/button2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, User, Calendar, Clock, Edit, MoreHorizontal, AlertCircle } from "lucide-react"
import type { WarrantyCard } from "@/types/warranty"
import { formatDateShort, getDaysRemaining } from "@/utils"

interface WarrantyCardItemProps {
  card: WarrantyCard
  onEdit: (card: WarrantyCard) => void
  onToggleStatus: (cardId: number) => void
}

export function WarrantyCardItem({ card, onEdit, onToggleStatus }: WarrantyCardItemProps) {
  const daysRemaining = getDaysRemaining(card.endDate)
  const isExpiringSoon = daysRemaining <= 30 && daysRemaining > 0
  const isExpired = daysRemaining <= 0

  const getStatusColor = (status: boolean) => {
    return status ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span className="truncate">{card.procedureName}</span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Badge className={`${getStatusColor(card.status)} text-xs`}>
              {card.status ? "Hoạt động" : "Không hoạt động"}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(card)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="font-medium truncate">{card.patientName}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-gray-500 text-xs">Bắt đầu</p>
              <p className="font-medium text-xs sm:text-sm truncate">{formatDateShort(card.startDate)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-gray-500 text-xs">Kết thúc</p>
              <p className="font-medium text-xs sm:text-sm truncate">{formatDateShort(card.endDate)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span>Thời hạn {card.duration} tháng</span>
        </div>

        {card.status && (
          <div className="text-sm">
            {isExpired ? (
              <Badge variant="destructive" className="text-xs">
                Đã hết hạn {Math.abs(daysRemaining)} ngày trước
              </Badge>
            ) : isExpiringSoon ? (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                Hết hạn trong {daysRemaining} ngày
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Còn {daysRemaining} ngày
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-gray-500">Trạng thái</span>
          {card.status && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onToggleStatus(card.warrantyCardId)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <AlertCircle className="w-4 h-4 mr-1" />
              Vô hiệu hóa
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}