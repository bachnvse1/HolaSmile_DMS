import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { User, FileText } from "lucide-react"
import { toast } from "react-toastify"
import FilterBar from "./FilterBar"
import SummaryStats from "./SummaryStats"
import TreatmentTable from "./TreatmentTable"
import { getTreatmentRecordsByPatientId } from "@/services/treatmentService"
import { getPatientById } from "@/services/patientService"
import type { FilterFormData, TreatmentRecord } from "@/types/treatment"
import type { PatientDetail } from "@/services/patientService"
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "../AuthGuard"
import { PatientLayout } from "@/layouts/patient"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

const formatDateForDisplay = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  
  try {
    if (dateString.includes('/')) {
      const parts = dateString.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('vi-VN')
        }
      }
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    
    return date.toLocaleDateString('vi-VN')
  } catch (error) {
    console.error('Error formatting date for display:', error)
    return 'N/A'
  }
}

export default function PatientTreatmentRecordsSection() {
  const userInfo = useUserInfo()
  const patientId = userInfo?.roleTableId || ""
  const { register, watch } = useForm<FilterFormData>({
    defaultValues: {
      searchTerm: "",
      filterStatus: "all",
      filterDentist: "all",
    },
  })

  const [records, setRecords] = useState<TreatmentRecord[]>([])
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [patientLoading, setPatientLoading] = useState(false)

  const searchTerm = watch("searchTerm")
  const filterStatus = watch("filterStatus")
  const filterDentist = watch("filterDentist")

  const fetchPatientInfo = useCallback(async () => {
    if (!patientId) return
    
    setPatientLoading(true)
    try {
      const patientData = await getPatientById(Number(patientId))
      console.log("Patient data:", patientData)
      setPatient(patientData)
    } catch (error: any) {
      console.error("Error fetching patient:", error)
      toast.error(error.response?.data?.message || "Không thể tải thông tin bệnh nhân")
    } finally {
      setPatientLoading(false)
    }
  }, [patientId])

  const fetchRecords = useCallback(async () => {
    if (!patientId || isNaN(Number(patientId))) return
    
    try {
      setLoading(true)
      const data = await getTreatmentRecordsByPatientId(Number(patientId))
      setRecords(data || [])
    } catch (error: any) {
      console.error("Error fetching records:", error)
      const errorMessage = error.response?.data?.message || error.message

      if (errorMessage === "Không có dữ liệu phù hợp" || error.response?.status === 404) {
        setRecords([])
      } else {
        toast.error("Không thể tải danh sách hồ sơ điều trị")
      }
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    if (patientId) {
      fetchPatientInfo()
      fetchRecords()
    }
  }, [patientId, fetchPatientInfo, fetchRecords])

  const filteredRecords = records.filter((record) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      record.toothPosition?.toLowerCase().includes(searchLower) ||
      record.diagnosis?.toLowerCase().includes(searchLower) ||
      record.symptoms?.toLowerCase().includes(searchLower) ||
      record.treatmentRecordID?.toString().includes(searchTerm) ||
      (record.dentistName?.toLowerCase().includes(searchLower) ?? false)

    const matchesStatus =
      filterStatus === "all" || 
      record.treatmentStatus?.toLowerCase() === filterStatus.toLowerCase()

    const matchesDentist =
      filterDentist === "all" || 
      record.dentistID?.toString() === filterDentist

    return matchesSearch && matchesStatus && matchesDentist
  })

  const renderPatientInfo = () => {
    if (patientLoading) {
      return (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (!patient) return null

    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <User className="h-5 w-5" />
            <span className="font-medium">Thông tin bệnh nhân</span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-gray-700">Họ tên:</Label>
              <div className="text-gray-900 font-medium">{patient.fullname || 'N/A'}</div>
            </div>

            <div>
              <Label className="text-gray-700">Giới tính:</Label>
              <div className="text-gray-900">{patient.gender ? 'Nam' : 'Nữ'}</div>
            </div>

            <div>
              <Label className="text-gray-700">Số điện thoại:</Label>
              <div className="text-gray-900">{patient.phone || 'N/A'}</div>
            </div>

            <div>
              <Label className="text-gray-700">Email:</Label>
              <div className="text-gray-900">{patient.email || 'N/A'}</div>
            </div>

            <div>
              <Label className="text-gray-700">Ngày sinh:</Label>
              <div className="text-gray-900">
                {formatDateForDisplay(patient.dob)}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-gray-700">Địa chỉ:</Label>
              <div className="text-gray-900">{patient.address || 'N/A'}</div>
            </div>

            <div className="sm:col-span-3">
              <Label className="text-gray-700">Tiền sử bệnh lý:</Label>
              <div className="text-gray-900 mt-1">
                {patient.underlyingConditions || 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <AuthGuard requiredRoles={['Patient']}>
      <PatientLayout userInfo={userInfo}>
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Hồ sơ điều trị nha khoa
            </h2>
          </div>
          
          {renderPatientInfo()}
          
          <FilterBar register={register} />
          
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <div className="space-y-4">
                <div className="text-lg">Đang tải dữ liệu...</div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          ) : (
            <TreatmentTable
              records={filteredRecords}
              patientId={Number(patientId)}
              patientName={userInfo?.name || ""}
              readonly
              onEdit={() => { }}
              onToggleDelete={() => Promise.resolve()}
            />
          )}
          
          <SummaryStats records={records} />
        </div>
      </PatientLayout>
    </AuthGuard>
  )
}