import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, FileText } from "lucide-react"
import { useSearchParams } from "react-router"
import { toast } from "react-toastify"

import FilterBar from "@/components/patient/FilterBar"
import SummaryStats from "@/components/patient/SummaryStats"
import TreatmentTable from "@/components/patient/TreatmentTable"
import TreatmentModal from "@/components/patient/TreatmentModal"
import { Navigation } from "@/layouts/homepage/Navigation"

import type { FilterFormData, TreatmentFormData, TreatmentRecord } from "@/types/treatment"
import { getTreatmentRecordsByUser, deleteTreatmentRecord } from "@/services/treatmentService"

const PatientTreatmentRecords: React.FC = () => {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get("userId")

  const { register, watch } = useForm<FilterFormData>({
    defaultValues: {
      searchTerm: "",
      filterStatus: "all",
      filterDentist: "all",
    },
  })

  const treatmentForm = useForm<TreatmentFormData>()
  const { reset: resetTreatmentForm } = treatmentForm

  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null)

  const searchTerm = watch("searchTerm")
  const filterStatus = watch("filterStatus")
  const filterDentist = watch("filterDentist")

  const fetchRecords = async () => {
    if (!userId) return
    try {
      const data = await getTreatmentRecordsByUser(Number(userId))
      setRecords(data)
    } catch (error) {
      console.error("Error fetching treatment records:", error)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [userId])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.toothPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.treatmentRecordID.toString().includes(searchTerm) ||
      (record.dentistName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesStatus =
      filterStatus === "all" || record.treatmentStatus.toLowerCase() === filterStatus.toLowerCase()

    const matchesDentist =
      filterDentist === "all" || record.dentistID.toString() === filterDentist

    return matchesSearch && matchesStatus && matchesDentist
  })

  const handleToggleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xoá hồ sơ điều trị này?")) return

    const toastId = toast.loading("Đang xoá hồ sơ...")

    try {
      const response = await deleteTreatmentRecord(id)

      setRecords((prev) => prev.filter((r) => r.treatmentRecordID !== id))

      toast.update(toastId, {
        render: response?.message || "Đã xoá thành công",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error: any) {
      toast.update(toastId, {
        render: error.message || "Không thể xoá hồ sơ.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      console.error("Delete error:", error)
    }
  }

  const handleAddRecord = () => {
    setEditingRecord(null)
    resetTreatmentForm()
    setIsModalOpen(true)
  }

  const handleEditRecord = (record: TreatmentRecord) => {
    setEditingRecord(record)
    resetTreatmentForm({
      appointmentID: record.appointmentID,
      dentistID: record.dentistID,
      procedureID: record.procedureID,
      toothPosition: record.toothPosition,
      quantity: record.quantity,
      unitPrice: record.unitPrice,
      discountAmount: record.discountAmount,
      discountPercentage: record.discountPercentage,
      consultantEmployeeID: record.consultantEmployeeID ?? 0,
      treatmentStatus: record.treatmentStatus,
      symptoms: record.symptoms,
      diagnosis: record.diagnosis,
      treatmentDate: new Date(record.treatmentDate).toISOString().split("T")[0],
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async () => {
    await fetchRecords()
    setIsModalOpen(false)
    setEditingRecord(null)
    resetTreatmentForm()
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Hồ sơ điều trị nha khoa
                </h2>
                <p className="text-gray-600 mt-1">
                  Lịch sử đầy đủ về các phương pháp điều trị và thủ thuật nha khoa
                </p>
              </div>
              <button
                onClick={handleAddRecord}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Thêm Hồ sơ điều trị mới
              </button>
            </div>

            <div className="p-6">
              <FilterBar register={register} />
              <TreatmentTable
                records={filteredRecords}
                onEdit={handleEditRecord}
                onToggleDelete={handleToggleDelete}
              />
            </div>
          </div>

          <SummaryStats records={records} />

          <TreatmentModal
            formMethods={treatmentForm}
            isOpen={isModalOpen}
            isEditing={!!editingRecord}
            onClose={() => {
              setIsModalOpen(false)
              setEditingRecord(null)
              resetTreatmentForm()
            }}
            updatedBy={1}
            recordId={editingRecord?.treatmentRecordID}
            onSubmit={handleFormSubmit}
          />
        </div>
      </div>
    </>
  )
}

export default PatientTreatmentRecords
