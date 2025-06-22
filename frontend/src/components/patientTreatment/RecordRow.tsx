import { Calendar, Clock, Edit, X } from "lucide-react"
import type { TreatmentRecord } from "@/types/treatment"
import { formatCurrency } from "@/utils/format"

interface RecordRowProps {
    record: TreatmentRecord
    onEdit: (record: TreatmentRecord) => void
    onToggleDelete: (id: number) => void
}

const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case "completed":
            return "bg-green-100 text-green-800 border-green-200"
        case "in progress":
            return "bg-blue-100 text-blue-800 border-blue-200"
        case "scheduled":
            return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "cancelled":
            return "bg-red-100 text-red-800 border-red-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

const RecordRow: React.FC<RecordRowProps> = ({ record, onEdit, onToggleDelete }) => {
    return (
        <tr className={`hover:bg-gray-50 ${record.isDeleted ? "opacity-50 bg-gray-50" : ""}`}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                        <p className="font-medium text-gray-900">{record.appointmentDate}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {record.appointmentTime}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-medium text-gray-900">{record.toothPosition}</p>
                <p className="text-sm text-gray-600">Qty: {record.quantity}</p>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <p className="font-medium text-gray-900">{record.procedureName}</p>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm text-gray-900">{record.dentistName}</p>
            </td>

            <td className="px-6 py-4">
                <p className="text-gray-900 max-w-xs truncate" title={record.diagnosis}>
                    {record.diagnosis}
                </p>
                <p className="text-sm text-gray-600 max-w-xs truncate" title={record.symptoms}>
                    {record.symptoms}
                </p>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <div>
                    <p className="font-medium text-gray-900">{formatCurrency(record.totalAmount)}</p>
                    <p className="text-sm text-gray-600">
                        {record.discountAmount > 0 && `Disc: ${formatCurrency(record.discountAmount)}`}
                        {record.discountPercentage > 0 && ` (${record.discountPercentage}%)`}
                    </p>
                </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(record.treatmentStatus)}`}>
                        {record.treatmentStatus}
                    </span>
                    {record.isDeleted && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border bg-gray-100 text-gray-600 border-gray-200">
                            Deleted
                        </span>
                    )}
                </div>
            </td>

            <td className="px-6 py-4 whitespace-nowrap">
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
                        <>
                            <X className="h-3 w-3" />
                            Xóa
                        </>
                    </button>
                </div>
            </td>
        </tr>
    )
}

export default RecordRow
