import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface ProcedureFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  totalProcedures: number
  filteredCount: number
  isLoading: boolean
  onClearFilters: () => void
  hasActiveFilters: boolean
}

export function ProcedureFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalProcedures,
  filteredCount,
  isLoading,
  onClearFilters,
  hasActiveFilters,
}: ProcedureFiltersProps) {
  return (
    <div className="bg-muted/50 p-4 rounded-lg space-y-4">
      {isLoading ? (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="sm:w-48">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Tìm Kiếm Thủ Thuật</Label>
            <Input
              id="search"
              placeholder="Tìm theo tên hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="sm:w-48">
            <Label htmlFor="statusFilter">Lọc Theo Trạng Thái</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất Cả Trạng Thái</SelectItem>
                <SelectItem value="active">Hoạt Động</SelectItem>
                <SelectItem value="inactive">Không Hoạt Động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <p className="text-sm text-muted-foreground">
            Hiển thị {filteredCount} trong tổng số {totalProcedures} thủ thuật
          </p>
        )}
        {hasActiveFilters && !isLoading && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Xóa Bộ Lọc
          </Button>
        )}
      </div>
    </div>
  )
}
