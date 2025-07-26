import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, CheckCircle, XCircle, Activity } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import type { BasicTask, TaskStatus } from "@/types/task"

interface TaskDetailModalProps {
  task: BasicTask | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
  if (!task) return null

  const statusText = task.status === "Completed" ? "Hoàn thành" : "Chưa hoàn thành"

  const getStatusIcon = (status: TaskStatus) =>
    status === "Completed" ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-orange-600" />

  const getStatusColor = (status: TaskStatus) =>
    status === "Completed" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm 'ngày' dd/MM/yyyy", { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: vi })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "HH:mm", { locale: vi })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-semibold">Chi tiết nhiệm vụ</span>
            <Badge className={getStatusColor(task.status)}>
              <div className="flex items-center gap-2">
                {getStatusIcon(task.status)}
                {statusText}
              </div>
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Thông tin cơ bản */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Thông tin cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên nhiệm vụ</label>
                  <p className="text-base font-semibold">{task.progressName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID nhiệm vụ</label>
                  <p className="text-base">#{task.taskId}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Mô tả nhiệm vụ</label>
                <p className="text-base mt-1 p-3 bg-gray-50 rounded-md border">
                  {task.description || "Không có mô tả"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thông tin phân công */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Phân công thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border">
                <User className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-base">
                    {task.assistantName || "Chưa được phân công"}
                  </p>
                  <p className="text-sm text-muted-foreground">Người thực hiện nhiệm vụ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Thời gian thực hiện */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Thời gian thực hiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border">
                    <Calendar className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-semibold">Thời gian bắt đầu</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(task.startTime)} lúc {formatTime(task.startTime)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md border">
                    <Clock className="h-6 w-6 text-red-600" />
                    <div>
                      <p className="font-semibold">Thời gian kết thúc</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(task.endTime)} lúc {formatTime(task.endTime)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-muted-foreground">Thời gian thực hiện đầy đủ</p>
                <p className="font-medium">
                  {formatDateTime(task.startTime)} → {formatDateTime(task.endTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}