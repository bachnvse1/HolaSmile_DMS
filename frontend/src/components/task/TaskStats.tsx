import { Card, CardContent } from "@/components/ui/card"

interface TaskStatsProps {
  total: number
  completed: number
  notCompleted: number
}

export function TaskStats({ total, completed, notCompleted }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-sm text-muted-foreground">Tổng số nhiệm vụ</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{completed}</p>
          <p className="text-sm text-muted-foreground">Hoàn thành</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{notCompleted}</p>
          <p className="text-sm text-muted-foreground">Chưa hoàn thành</p>
        </CardContent>
      </Card>
    </div>
  )
}
