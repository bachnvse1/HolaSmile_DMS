import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface WarrantyHeaderProps {
  onCreateClick: () => void
}

export function WarrantyHeader({ onCreateClick }: WarrantyHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Quản lý thẻ bảo hành</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Quản lý thẻ bảo hành điều trị nha khoa và theo dõi bảo hiểm
          </p>
        </div>

        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" onClick={onCreateClick}>
          <Plus className="w-5 h-5 mr-2" />
          <span className="hidden sm:inline">Tạo thẻ bảo hành</span>
          <span className="sm:hidden">Tạo mới</span>
        </Button>
      </div>
    </div>
  )
}
