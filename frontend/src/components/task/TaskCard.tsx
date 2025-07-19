import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {Badge} from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card,CardContent } from "@/components/ui/card"
import { Calendar, Clock, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { BasicTask } from "@/types/task" 

interface TaskCardProps {
  task: BasicTask
  onToggleStatus: (taskId: number) => void
  onDelete: (taskId: number) => void
}

export function TaskCard({ task, onToggleStatus, onDelete }: TaskCardProps) {
  const statusText = task.status ? "Hoàn thành" : "Chưa hoàn thành"

  const getStatusIcon = (status: boolean) =>
    status ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-orange-600" />

  const getStatusColor = (status: boolean) =>
    status ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase()

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })
    } catch {
      return dateString
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{task.progressName}</h3>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <Badge className={getStatusColor(task.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  {statusText}
                </div>
              </Badge>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="text-xs">
                    {task.assistantName ? getInitials(task.assistantName) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{task.assistantName || "Chưa phân công"}</p>
                  <p className="text-xs text-muted-foreground">Người thực hiện</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDateTime(task.startTime)}</p>
                  <p className="text-xs text-muted-foreground">Thời gian bắt đầu</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{formatDateTime(task.endTime)}</p>
                  <p className="text-xs text-muted-foreground">Thời gian kết thúc</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Xem Chi Tiết</DropdownMenuItem>
              <DropdownMenuItem>Chỉnh Sửa</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(task.taskId)}>
                {task.status ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(task.taskId)}
              >
                Xóa Nhiệm Vụ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
