import { Button } from "@/components/ui/button2"
import { FileText } from "lucide-react"

interface WarrantyEmptyStateProps {
  searchQuery: string
  filterStatus: "all" | "active" | "inactive"
  onClearSearch: () => void
}

export function WarrantyEmptyState({ searchQuery, filterStatus, onClearSearch }: WarrantyEmptyStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white rounded-xl shadow-sm border">
      <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Không tìm thấy thẻ bảo hành</h3>
      <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">
        {searchQuery
          ? `Không có thẻ bảo hành nào khớp với "${searchQuery}"`
          : filterStatus === "all"
            ? "Tạo thẻ bảo hành đầu tiên để bắt đầu."
            : `Không tìm thấy thẻ bảo hành ${filterStatus === "active" ? "hoạt động" : "không hoạt động"}.`}
      </p>
      {searchQuery && (
        <Button variant="outline" onClick={onClearSearch} className="w-full sm:w-auto bg-transparent">
          Xóa tìm kiếm
        </Button>
      )}
    </div>
  )
}
