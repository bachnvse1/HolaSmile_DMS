import { FileText } from "lucide-react"
import type { TreatmentRecord } from "@/types/treatment"
import RecordRow from "./RecordRow"

interface TreatmentTableProps {
  records: TreatmentRecord[]
  onEdit: (record: TreatmentRecord) => void
  onToggleDelete: (id: number) => void
  patientId: number
  readonly?: boolean
}

const TreatmentTable: React.FC<TreatmentTableProps> = ({
  records,
  onEdit,
  onToggleDelete,
  patientId,
  readonly,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lịch hẹn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vị trí răng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thủ thuật
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bác sĩ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                Chẩn đoán & Triệu chứng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thành tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày điều trị & TV tư vấn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              {!readonly && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record) => (
              <RecordRow
                key={record.treatmentRecordID}
                record={record}
                onEdit={onEdit}
                onToggleDelete={onToggleDelete}
                patientId={patientId}
                readonly={readonly}
              />
            ))}
          </tbody>
        </table>
      </div>

      {records.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Không tìm thấy hồ sơ điều trị phù hợp.</p>
        </div>
      )}
    </div>
  )
}

export default TreatmentTable
