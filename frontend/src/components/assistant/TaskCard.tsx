import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Eye } from "lucide-react"
import type { Task } from "@/types/task"

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: number, status: Task["status"]) => void
  onViewDetails: (task: Task) => void
}

const formatTime = (time: string) => {
  const parts = time.split(":")
  return `${parts[0]}:${parts[1]}`
}

export function TaskCard({ task, onStatusChange, onViewDetails }: TaskCardProps) {
  const getStatusColor = (status: Task["status"]) =>
    status === "Completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"

  const getStatusText = (status: Task["status"]) =>
    status === "Completed" ? "Hoàn thành" : "Đang chờ"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{task.progressName}</span>
          <Badge className={getStatusColor(task.status)}>
            {getStatusText(task.status)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p><strong>Thủ thuật:</strong> {task.procedureName || "Không rõ"}</p>
        <p><strong>Nha sĩ:</strong> {task.dentistName || "Không rõ"}</p>
        <p>
          <strong>Thời gian:</strong> {formatTime(task.startTime)} - {formatTime(task.endTime)}
        </p>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => onViewDetails(task)}>
            <Eye className="w-4 h-4 mr-2" />
            Xem chi tiết
          </Button>

          {task.status === "Pending" && (
            <Button size="sm" onClick={() => onStatusChange(task.taskId, "Completed")}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Hoàn thành
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
