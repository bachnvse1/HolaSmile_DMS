import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MoreHorizontal, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { BasicTask, TaskStatus } from "@/types/task"
import { EditTaskModal } from "./EditTaskModal"

interface TaskCardProps {
  task: BasicTask
  onViewDetail: (task: BasicTask) => void
  onTaskUpdate: () => void
  assistants: Assistant[]
  isUpdating?: boolean
}

interface Assistant {
  assistantId: number
  fullname: string
  phone: string
}

export function TaskCard({ 
  task, 
  onViewDetail, 
  onTaskUpdate, 
  assistants, 
  isUpdating = false 
}: TaskCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const statusText = task.status === "Completed" ? "Hoàn thành" : "Chưa hoàn thành"

  const getStatusIcon = (status: TaskStatus) =>
    status === "Completed" ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-orange-600" />

  const getStatusColor = (status: TaskStatus) =>
    status === "Completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })
    } catch {
      return dateString
    }
  }

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow ${isUpdating ? 'opacity-70' : ''}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{task.progressName}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <Badge className={getStatusColor(task.status)}>
                  <div className="flex items-center gap-1">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      getStatusIcon(task.status)
                    )}
                    {statusText}
                  </div>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetail(task)}>
                  Xem Chi Tiết
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit} disabled={isUpdating}>
                  Chỉnh Sửa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskModal
        task={task}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onTaskUpdate={onTaskUpdate}
        assistants={assistants}
      />
    </>
  )
}