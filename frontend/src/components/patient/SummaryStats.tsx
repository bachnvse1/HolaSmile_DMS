import { Calendar, Clock, FileText } from "lucide-react"
import type { TreatmentRecord } from "@/types/treatment"
import { formatCurrency } from "@/utils/currencyUtils"

interface SummaryStatsProps {
  records: TreatmentRecord[]
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ records }) => {
  const activeRecords = records.filter((r) => !r.isDeleted)

  const totalRevenue = activeRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const completedCount = activeRecords.filter((r) => r.treatmentStatus?.toLowerCase() === "completed").length
  const pendingCount = activeRecords.filter((r) => r.treatmentStatus?.toLowerCase() !== "completed").length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng số hồ sơ</p>
            <p className="text-2xl font-bold text-gray-900">{activeRecords.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calendar className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Tổng tiền</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Calendar className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã hoàn thành</p>
            <p className="text-lg font-bold text-gray-900">{completedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Clock className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Đã lên lịch</p>
            <p className="text-lg font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SummaryStats