import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, CheckCircle, XCircle, Activity, Stethoscope, AlertTriangle, ClipboardList } from "lucide-react"
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

  const formatTime = (timeString: string) => {
    // Nếu là format HH:MM thì giữ nguyên, nếu không thì format lại
    if (timeString && timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString
    }
    try {
      return format(new Date(timeString), "HH:mm", { locale: vi })
    } catch {
      return timeString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          {/* Thông tin cơ bản nhiệm vụ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Thông tin nhiệm vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên nhiệm vụ</label>
                  <p className="text-base font-semibold">{task.progressName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên quy trình</label>
                  <p className="text-base">{(task as any).procedureName || "Không có thông tin"}</p>
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

          {/* Thông tin y tế */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Thông tin y tế
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tên nha sĩ</label>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border">
                    <User className="h-6 w-6 text-blue-600" />
                    <p className="font-medium">{(task as any).dentistName || "Chưa có thông tin"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Chẩn đoán</label>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-md border">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    <p className="font-medium">{(task as any).diagnosis || "Không có chẩn đoán"}</p>
                  </div>
                </div>
              </div>
              
              {/* Triệu chứng */}
              <div className="mt-4">
                <label className="text-sm font-medium text-muted-foreground">Triệu chứng</label>
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md border">
                  <ClipboardList className="h-6 w-6 text-red-600" />
                  <p className="font-medium">{(task as any).symptoms || "Không có triệu chứng được ghi nhận"}</p>
                </div>
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
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-base">
                    {task.assistantName || "Chưa được phân công"}
                  </p>
                  <p className="text-sm text-muted-foreground">Trợ lý thực hiện nhiệm vụ</p>
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
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ngày điều trị</label>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-md border">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold">
                          {(task as any).treatmentDate ? formatDate((task as any).treatmentDate) : "Chưa xác định"}
                        </p>
                        <p className="text-xs text-muted-foreground">Ngày thực hiện điều trị</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thời gian bắt đầu</label>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md border">
                      <Clock className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold">
                          {(task as any).startTime ? formatTime((task as any).startTime) : "Chưa xác định"}
                        </p>
                        <p className="text-xs text-muted-foreground">Giờ bắt đầu thực hiện</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ngày tạo nhiệm vụ</label>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-md border">
                      <Calendar className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-semibold">
                          {(task as any).createdAt ? formatDateTime((task as any).createdAt) : "Chưa có thông tin"}
                        </p>
                        <p className="text-xs text-muted-foreground">Thời điểm tạo nhiệm vụ</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Thời gian kết thúc</label>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-md border">
                      <Clock className="h-6 w-6 text-red-600" />
                      <div>
                        <p className="font-semibold">
                          {(task as any).endTime ? formatTime((task as any).endTime) : "Chưa xác định"}
                        </p>
                        <p className="text-xs text-muted-foreground">Giờ kết thúc dự kiến</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />
              
              <div className="text-center p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-muted-foreground">Khoảng thời gian thực hiện</p>
                <p className="font-medium">
                  {(task as any).startTime && (task as any).endTime 
                    ? `${formatTime((task as any).startTime)} → ${formatTime((task as any).endTime)}` 
                    : "Chưa xác định thời gian"}
                </p>
                {(task as any).treatmentDate && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ngày: {formatDate((task as any).treatmentDate)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}