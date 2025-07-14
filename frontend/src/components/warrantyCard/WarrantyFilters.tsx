import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, CheckCircle2, AlertCircle, List, Grid3X3 } from "lucide-react"
import type { WarrantyCard } from "@/types/warranty"

interface WarrantyFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterStatus: "all" | "active" | "inactive"
  onFilterChange: (status: "all" | "active" | "inactive") => void
  viewMode: "cards" | "table"
  onViewModeChange: (mode: "cards" | "table") => void
  warrantyCards: WarrantyCard[]
}

export function WarrantyFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  viewMode,
  onViewModeChange,
  warrantyCards,
}: WarrantyFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm theo bệnh nhân hoặc thủ thuật..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewModeChange(viewMode === "cards" ? "table" : "cards")}
            className="w-full sm:w-auto"
          >
            {viewMode === "cards" ? (
              <>
                <List className="w-4 h-4 mr-2" />
                Xem bảng
              </>
            ) : (
              <>
                <Grid3X3 className="w-4 h-4 mr-2" />
                Xem thẻ
              </>
            )}
          </Button>
        </div>

        <Tabs value={filterStatus} onValueChange={(value) => onFilterChange(value as "all" | "active" | "inactive")} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Tất cả</span>
              <span className="sm:hidden">Tất cả</span>
              <span className="ml-1">({warrantyCards.length})</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Hoạt động</span>
              <span className="sm:hidden">Active</span>
              <span className="ml-1">({warrantyCards.filter((c) => c.status).length})</span>
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Không hoạt động</span>
              <span className="sm:hidden">Inactive</span>
              <span className="ml-1">({warrantyCards.filter((c) => !c.status).length})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}
