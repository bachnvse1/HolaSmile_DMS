import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Calendar, Timer } from "lucide-react"
import type { Task } from "@/types/task"

interface TaskStatsProps {
    tasks: Task[]
}

export function TaskStats({ tasks }: TaskStatsProps) {
    const stats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "Completed").length,
        notCompleted: tasks.filter((t) => t.status === "Pending").length,
    }

    const completionRate =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    const totalDuration = tasks.reduce((acc, task) => {
        const start = new Date(`2000-01-01T${task.startTime}`)
        const end = new Date(`2000-01-01T${task.endTime}`)
        const diffMs = end.getTime() - start.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        return acc + diffMins
    }, 0)

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Nhiệm Vụ</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Tất cả nhiệm vụ được giao</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chưa Hoàn Thành</CardTitle>
                    <Clock className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.notCompleted}</div>
                    <p className="text-xs text-muted-foreground">Nhiệm vụ chưa hoàn thành</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Hoàn Thành</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <p className="text-xs text-muted-foreground">Tỷ lệ: {completionRate}%</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tổng Thời Gian</CardTitle>
                    <Timer className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{formatDuration(totalDuration)}</div>
                    <p className="text-xs text-muted-foreground">Thời gian làm việc</p>
                </CardContent>
            </Card>
        </div>
    )
}
