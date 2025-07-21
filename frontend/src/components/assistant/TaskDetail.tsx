import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button2"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import type { Task } from "@/types/task"
import { Clock, FileText, User, Stethoscope, Calendar, Activity, AlertCircle } from "lucide-react"

interface TaskDetailsModalProps {
  task: Task | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (taskId: number, status: Task["status"]) => void
  isLoading?: boolean
}

export function TaskDetailsModal({
  task,
  isOpen,
  onOpenChange,
  isLoading = false
}: TaskDetailsModalProps) {
  const getStatusColor = (status: Task["status"]) =>
    status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"

  const getStatusText = (status: Task["status"]) =>
    status === "Completed" ? "Hoàn thành" : "Đang chờ"

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  const calculateDuration = () => {
    if (!task) return ""
    const [startHour, startMin] = task.startTime.split(":").map(Number)
    const [endHour, endMin] = task.endTime.split(":").map(Number)
    const diffMins = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    return diffMins >= 60
      ? `${Math.floor(diffMins / 60)} giờ ${diffMins % 60} phút`
      : `${diffMins} phút`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Chi Tiết Nhiệm Vụ Điều Trị
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 text-muted-foreground text-center">Đang tải chi tiết nhiệm vụ...</div>
        ) : !task ? (
          <div className="p-6 text-red-600 text-center">Không tìm thấy nhiệm vụ</div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">{task.progressName}</h2>
              <div className="flex flex-wrap gap-2">
                <Badge className={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
                <Badge variant="outline">{task.procedureName}</Badge>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Section title="Thông Tin Điều Trị" icon={<Activity className="w-5 h-5" />}>
                  <InfoItem icon={<Calendar />} label="Ngày điều trị" value={formatDate(task.treatmentDate)} />
                  <InfoItem icon={<Clock />} label="Thời gian" value={`${task.startTime} - ${task.endTime} (${calculateDuration()})`} />
                  <InfoItem icon={<User />} label="Nha sĩ điều trị" value={task.dentistName} />
                  <InfoItem icon={<Stethoscope />} label="Thủ thuật" value={task.procedureName} />
                </Section>
              </div>

              <div className="space-y-4">
                <Section title="Thông Tin Y Khoa" icon={<AlertCircle className="w-5 h-5" />}>
                  <InfoBox title="Triệu chứng" content={task.symptoms} />
                  <InfoBox title="Chẩn đoán" content={task.diagnosis} />
                  <div>
                    <p className="text-sm font-medium mb-1">Trạng thái hiện tại</p>
                    <Badge className={getStatusColor(task.status)}>{getStatusText(task.status)}</Badge>
                  </div>
                </Section>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="font-medium">Mô Tả Chi Tiết</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p className="text-muted-foreground">{task.description}</p>
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        {icon}
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
    </div>
  )
}

function InfoBox({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm">{content || "Không có thông tin"}</p>
      </div>
    </div>
  )
}