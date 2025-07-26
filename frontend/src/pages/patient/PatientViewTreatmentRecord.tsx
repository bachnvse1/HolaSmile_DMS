import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FileText, ArrowLeft, User } from "lucide-react"
import { useSearchParams, useNavigate } from "react-router"
import { toast } from "react-toastify"

import FilterBar from "@/components/patient/FilterBar"
import SummaryStats from "@/components/patient/SummaryStats"
import TreatmentTable from "@/components/patient/TreatmentTable"
import TreatmentModal from "@/components/patient/TreatmentModal"

import type { FilterFormData, TreatmentFormData, TreatmentRecord } from "@/types/treatment"
import type { PatientDetail } from "@/services/patientService" 
import { getTreatmentRecordsByPatientId, deleteTreatmentRecord } from "@/services/treatmentService"
import { getPatientById } from "@/services/patientService" // Import service để lấy thông tin bệnh nhân
import { useAuth } from '../../hooks/useAuth';
import { AuthGuard } from '../../components/AuthGuard';
import { StaffLayout } from '../../layouts/staff/StaffLayout';

const PatientTreatmentRecords: React.FC = () => {
  const [searchParams] = useSearchParams()
  const patientIdParam = searchParams.get("patientId")

  const patientId = Number(patientIdParam)

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
  const [patient, setPatient] = useState<PatientDetail | null>(null) // Sử dụng PatientDetail
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null)
  const [loading, setLoading] = useState(false)

  const searchTerm = watch("searchTerm")
  const filterStatus = watch("filterStatus")
  const filterDentist = watch("filterDentist")
  const navigate = useNavigate()

  const { fullName, userId, role } = useAuth()
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }

  // Lấy thông tin bệnh nhân
  const fetchPatientInfo = async () => {
    if (!patientId) return
    try {
      const patientData = await getPatientById(patientId)
      console.log("Patient data:", patientData)
      setPatient(patientData)
    } catch (error) {
      toast.error("Không thể tải thông tin bệnh nhân")
    }
  }

  const fetchRecords = async () => {
    if (!patientId) return
    try {
      setLoading(true)
      const data = await getTreatmentRecordsByPatientId(Number(patientId))
      setRecords(data)
    } catch (error) {
      console.error("Error fetching treatment records:", error)
      toast.error("Không thể tải hồ sơ điều trị")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo()
      fetchRecords()
    }
  }, [patientId])

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
    }
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
      discountAmount: record.discountAmount ?? undefined,
      discountPercentage: record.discountPercentage ?? undefined,
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
    <AuthGuard requiredRoles={['Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Quay lại"
                      >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                      </button>
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" /> Hồ sơ điều trị nha khoa
                      </h2>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Lịch sử đầy đủ về các phương pháp điều trị và thủ thuật nha khoa
                    </p>
                  </div>
                </div>

                {/* Hiển thị thông tin bệnh nhân */}
                {patient && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                      <User className="h-5 w-5" />
                      <span className="font-medium">Thông tin bệnh nhân:</span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Họ tên:</span>
                        <div className="text-gray-900">{patient.fullname}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Giới tính:</span>
                        <div className="text-gray-900">{patient.gender ? 'Nam' : 'Nữ'}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Số điện thoại:</span>
                        <div className="text-gray-900">{patient.phone}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Email:</span>
                        <div className="text-gray-900">{patient.email}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <FilterBar register={register} />
                {loading ? (
                  <div className="text-center py-10 text-gray-500">
                    Đang tải dữ liệu...
                  </div>
                ) : (
                  <TreatmentTable
                    records={filteredRecords}
                    onEdit={handleEditRecord}
                    onToggleDelete={handleToggleDelete}
                    patientId={patientId}
                    patientName={patient?.fullname || ""}
                  />
                )}
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
              updatedBy={Number(userId)}
              recordId={editingRecord?.treatmentRecordID}
              onSubmit={handleFormSubmit}
            />
          </div>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}

export default PatientTreatmentRecords