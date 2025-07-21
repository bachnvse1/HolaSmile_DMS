import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskFilter } from "@/types/task"

interface TaskFiltersProps {
  filters: TaskFilter
  onFiltersChange: (filters: TaskFilter) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  totalTasks: number
  filteredCount: number
  onClearFilters: () => void
  hasActiveFilters: boolean
  tasks: any[]
}

export function TaskFilters({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  totalTasks,
  filteredCount,
  onClearFilters,
  hasActiveFilters,
  tasks,
}: TaskFiltersProps) {
  const updateFilter = (key: keyof TaskFilter, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const uniqueDentists = [...new Set(tasks.map((task) => task.dentistName))]
  const uniqueProcedures = [...new Set(tasks.map((task) => task.procedureName))]

  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Tìm Kiếm Nhiệm Vụ</Label>
          <Input
            id="search"
            placeholder="Tìm theo tên tiến trình, mô tả, triệu chứng hoặc chẩn đoán..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Trạng Thái</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="Completed">Hoàn thành</SelectItem>
                <SelectItem value="Pending">Chưa hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFilter">Thời Gian</Label>
            <Select value={filters.timeRange} onValueChange={(value) => updateFilter("timeRange", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="morning">Buổi sáng (6:00-12:00)</SelectItem>
                <SelectItem value="afternoon">Buổi chiều (12:00-18:00)</SelectItem>
                <SelectItem value="evening">Buổi tối (18:00-24:00)</SelectItem>
                <SelectItem value="night">Đêm (0:00-6:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dentistFilter">Nha Sĩ</Label>
            <Select value={filters.dentist} onValueChange={(value) => updateFilter("dentist", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {uniqueDentists.map((dentist) => (
                  <SelectItem key={dentist} value={dentist}>
                    {dentist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="procedureFilter">Thủ Thuật</Label>
            <Select value={filters.procedure} onValueChange={(value) => updateFilter("procedure", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {uniqueProcedures.map((procedure) => (
                  <SelectItem key={procedure} value={procedure}>
                    {procedure}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Hiển thị {filteredCount} trong tổng số {totalTasks} nhiệm vụ
        </p>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Xóa Bộ Lọc
          </Button>
        )}
      </div>
    </div>
  )
}
