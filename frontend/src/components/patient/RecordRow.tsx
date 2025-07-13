import { Calendar, Clock, Edit, X, BarChart2, UserCheck, Camera } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import type { TreatmentRecord } from "@/types/treatment"
import { formatCurrency } from "@/utils/format"
import { formatDateOnly } from "@/utils/date"
import { useNavigate } from "react-router"

interface RecordRowProps {
  record: TreatmentRecord
  onEdit: (record: TreatmentRecord) => void
  onToggleDelete: (id: number) => void
  patientId: number
  readonly?: boolean
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "bg-green-100 text-green-800 border-green-200"
    case "in-progress":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "canceled":
      return "bg-red-100 text-red-800 border-red-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getVietnameseStatus = (status: string) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "Đã lên lịch"
    case "in-progress":
      return "Đang điều trị"
    case "completed":
      return "Đã hoàn tất"
    case "canceled":
      return "Đã huỷ"
    default:
      return status
  }
}

const RecordRow: React.FC<RecordRowProps> = ({ record, onEdit, onToggleDelete, patientId, readonly }) => {
  const navigate = useNavigate();
  return (
    <tr className={`hover:bg-gray-50 ${record.isDeleted ? "opacity-50 bg-gray-50" : ""}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{formatDateOnly(record.appointmentDate)}</p>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {record.appointmentTime}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="font-medium text-gray-900">{record.toothPosition}</p>
        <p className="text-sm text-gray-600">Số lượng: {record.quantity}</p>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="font-medium text-gray-900">{record.procedureName}</p>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">{record.dentistName}</p>
      </td>

      <td className="px-6 py-4 max-w-xs">
        <p className="text-gray-900 truncate" title={record.diagnosis}>
          {record.diagnosis}
        </p>
        <p className="text-sm text-gray-600 truncate" title={record.symptoms}>
          {record.symptoms}
        </p>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <p className="font-medium text-gray-900">{formatCurrency(record.totalAmount)}</p>
          <p className="text-sm text-gray-600">
            {record.unitPrice && `Đơn giá: ${formatCurrency(record.unitPrice)} `}
            {record.discountAmount > 0 && `Giảm: ${formatCurrency(record.discountAmount)} `}
            {record.discountPercentage > 0 && `(${record.discountPercentage}%)`}
          </p>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">Ngày: {formatDateOnly(record.treatmentDate)}</p>
        {record.consultantEmployeeID && (
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <UserCheck className="h-4 w-4 text-gray-500" />
            TV: {record.consultantEmployeeID}
          </p>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.treatmentStatus)}`}>
            {getVietnameseStatus(record.treatmentStatus)}
          </span>
          {record.isDeleted && (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-600 border-gray-200">
              Đã xoá
            </span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        {!readonly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(record)}
              className="bg-white border border-gray-300 text-gray-700 px-2 py-1 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1"
            >
              <Edit className="h-3 w-3" />
              Sửa
            </button>
            <button
              onClick={() => onToggleDelete(record.treatmentRecordID)}
              className={`bg-white border px-2 py-1 rounded-md text-sm font-medium focus:outline-none focus:ring-2 flex items-center gap-1 ${record.isDeleted
                ? "border-green-300 text-green-700 hover:bg-green-50 focus:ring-green-500"
                : "border-red-300 text-red-700 hover:bg-red-50 focus:ring-red-500"
                }`}
            >
              <X className="h-3 w-3" />
              {record.isDeleted ? "Khôi phục" : "Xoá"}
            </button>
              <button
                onClick={() => navigate(`/patients/${patientId}/treatment-records/${record.treatmentRecordID}/images`)}
                className="bg-white border border-purple-300 text-purple-700 px-2 py-1 rounded-md text-sm font-medium hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center gap-1"
              >
                <Camera className="h-3 w-3" />
                Ảnh
              </button>
            <Button
              asChild
              variant="outline"
              className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-1"
            >
              <Link to={`/patient/view-treatment-progress/${record.treatmentRecordID}?patientId=${patientId}&dentistId=${record.dentistID}`}>
                <BarChart2 className="h-3 w-3" />
                Tiến độ
              </Link>
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}

export default RecordRow