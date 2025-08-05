import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FileText, ArrowLeft, User, Edit2, Save, X } from "lucide-react"
import { useSearchParams, useNavigate } from "react-router"
import { toast } from "react-toastify"

import FilterBar from "@/components/patient/FilterBar"
import SummaryStats from "@/components/patient/SummaryStats"
import TreatmentTable from "@/components/patient/TreatmentTable"
import TreatmentModal from "@/components/patient/TreatmentModal"
import TreatmentRecordDetail from "@/components/patient/TreatmentRecordDetail" // Add this import

import type { FilterFormData, TreatmentFormData, TreatmentRecord } from "@/types/treatment"
import type { PatientDetail } from "@/services/patientService"
import { getTreatmentRecordsByPatientId, deleteTreatmentRecord } from "@/services/treatmentService"
import { getPatientById, updatePatient } from "@/services/patientService"
import { useAuth } from '../../hooks/useAuth'
import { AuthGuard } from '../../components/AuthGuard'
import { StaffLayout } from '../../layouts/staff/StaffLayout'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmModal } from "@/components/ui/ConfirmModal"

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

const PatientTreatmentRecords: React.FC = () => {
  const [searchParams] = useSearchParams()
  const patientIdParam = searchParams.get("patientId")
  const navigate = useNavigate()

  const [patientIdError, setPatientIdError] = useState<string | null>(null)

  const patientId = patientIdParam ? Number(patientIdParam) : null

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingSubmitEvent, setPendingSubmitEvent] = useState<React.FormEvent | null>(null)

  // Add detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<TreatmentRecord | null>(null)

  useEffect(() => {
    if (!patientIdParam || isNaN(Number(patientIdParam))) {
      setPatientIdError("ID bệnh nhân không hợp lệ")
      toast.error("ID bệnh nhân không hợp lệ")
      navigate(-1)
    } else {
      setPatientIdError(null)
    }
  }, [patientIdParam, navigate])

  if (patientIdError || !patientId) {
    return null
  }

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
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [patientLoading, setPatientLoading] = useState(false)

  const [isEditingPatient, setIsEditingPatient] = useState(false)
  const [isUpdatingPatient, setIsUpdatingPatient] = useState(false)
  const [editingPatientData, setEditingPatientData] = useState<PatientDetail | null>(null)
  const [patientErrors, setPatientErrors] = useState<{ [key: string]: string }>({})

  const searchTerm = watch("searchTerm")
  const filterStatus = watch("filterStatus")
  const filterDentist = watch("filterDentist")

  const { fullName, userId, role } = useAuth()
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }

  // Add handler for view detail
  const handleViewDetail = (record: TreatmentRecord) => {
    setSelectedDetailRecord(record)
    setDetailModalOpen(true)
  }

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false)
    setSelectedDetailRecord(null)
  }

  const fetchPatientInfo = useCallback(async () => {
    if (!patientId) return

    setPatientLoading(true)
    try {
      const patientData = await getPatientById(patientId)
      console.log("Patient data:", patientData)
      setPatient(patientData)
      setEditingPatientData(patientData)
    } catch (error: any) {
      console.error("Error fetching patient:", error)
      toast.error(error.response?.data?.message || "Không thể tải thông tin bệnh nhân")
    } finally {
      setPatientLoading(false)
    }
  }, [patientId])

  const validatePatientData = (data: PatientDetail): { [key: string]: string } => {
    const errors: { [key: string]: string } = {}

    if (!data.fullname?.trim()) {
      errors.fullname = "Vui lòng nhập họ tên"
    }

    if (!data.phone?.trim()) {
      errors.phone = "Vui lòng nhập số điện thoại"
    } else if (!/^[0-9]{10,11}$/.test(data.phone.replace(/\s/g, ''))) {
      errors.phone = "Số điện thoại phải có 10-11 chữ số"
    }

    if (!data.email?.trim()) {
      errors.email = "Vui lòng nhập email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Định dạng email không đúng"
    }

    if (!data.address?.trim()) {
      errors.address = "Vui lòng nhập địa chỉ"
    }

    if (!data.dob?.trim()) {
      errors.dob = "Vui lòng chọn ngày sinh"
    }

    return errors
  }

  // Gọi khi người dùng ấn nút submit
  const handlePatientSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setPendingSubmitEvent(e)
    setShowConfirmModal(true)
  }

  // Gọi sau khi người dùng xác nhận từ modal
  const handlePatientUpdateConfirmed = async () => {
    if (!editingPatientData || !patientId || !pendingSubmitEvent) return

    // Đóng modal
    setShowConfirmModal(false)

    const validationErrors = validatePatientData(editingPatientData)
    setPatientErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Vui lòng sửa các lỗi trong form")
      return
    }

    setIsUpdatingPatient(true)
    const toastId = toast.loading("Đang cập nhật thông tin bệnh nhân...")

    try {
      let formattedDob = null
      if (editingPatientData.dob?.includes('-')) {
        const [year, month, day] = editingPatientData.dob.split('-')
        formattedDob = `${day}/${month}/${year}`
      } else {
        formattedDob = editingPatientData.dob
      }

      const formattedData = {
        ...editingPatientData,
        dob: formattedDob,
        gender: editingPatientData.gender ? "Male" : "Female"
      }

      await updatePatient(patientId, formattedData)
      await fetchPatientInfo()
      setIsEditingPatient(false)
      setPatientErrors({})
      toast.update(toastId, {
        render: "Cập nhật thông tin bệnh nhân thành công",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error: any) {
      console.error("Error updating patient:", error)
      if (error.response?.data?.errors) {
        setPatientErrors(error.response.data.errors)
      }
      toast.update(toastId, {
        render: error.response?.data?.message || "Không thể cập nhật thông tin bệnh nhân",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsUpdatingPatient(false)
      setPendingSubmitEvent(null)
    }
  }


  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString || dateString.trim() === '') return ''

    try {
      if (dateString.includes('/')) {
        const parts = dateString.split('/')
        if (parts.length === 3) {
          let [day, month, year] = parts

          const dayNum = parseInt(day)
          const monthNum = parseInt(month)
          const yearNum = parseInt(year)

          if (!isNaN(dayNum) && !isNaN(monthNum) && !isNaN(yearNum)) {
            return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
          }
        }
      } else if (dateString.includes('-')) {
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }
      }

      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      return ''
    } catch (error) {
      console.error('Error formatting date for input:', error)
      return ''
    }
  }

  const fetchRecords = useCallback(async () => {
    if (!patientId || isNaN(patientId)) return

    try {
      setLoading(true)
      const data = await getTreatmentRecordsByPatientId(patientId)
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
    if (patientId && !patientIdError) {
      fetchPatientInfo()
      fetchRecords()
    }
  }, [patientId, patientIdError, fetchPatientInfo, fetchRecords])

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

  const handleToggleDelete = async (id: number) => {
    if (!id) {
      toast.error("ID hồ sơ không hợp lệ")
      return
    }

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
      console.error("Error deleting record:", error)
      toast.update(toastId, {
        render: error.response?.data?.message || "Không thể xoá hồ sơ.",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleEditRecord = (record: TreatmentRecord) => {
    if (!record) {
      toast.error("Dữ liệu hồ sơ không hợp lệ")
      return
    }

    setEditingRecord(record)

    let treatmentDate = ''
    if (record.treatmentDate) {
      try {
        treatmentDate = new Date(record.treatmentDate).toISOString().split("T")[0]
      } catch (error) {
        console.error("Error formatting treatment date:", error)
        treatmentDate = ''
      }
    }

    resetTreatmentForm({
      appointmentID: record.appointmentID || 0,
      dentistID: record.dentistID || 0,
      procedureID: record.procedureID || 0,
      toothPosition: record.toothPosition || '',
      quantity: record.quantity || 1,
      unitPrice: record.unitPrice || 0,
      discountAmount: record.discountAmount ?? undefined,
      discountPercentage: record.discountPercentage ?? undefined,
      consultantEmployeeID: record.consultantEmployeeID ?? 0,
      treatmentStatus: record.treatmentStatus || '',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatmentDate: treatmentDate,
    })
    setIsModalOpen(true)
  }

  const handleFormSubmit = async () => {
    await fetchRecords()
    setIsModalOpen(false)
    setEditingRecord(null)
    resetTreatmentForm()
  }

  const handleCancelEdit = () => {
    setIsEditingPatient(false)
    setEditingPatientData(patient)
    setPatientErrors({})
  }

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <User className="h-5 w-5" />
              <span className="font-medium">Thông tin bệnh nhân</span>
            </div>
            {role === 'Receptionist' && !isEditingPatient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPatient(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isEditingPatient ? (
            <form onSubmit={handlePatientSubmitRequest} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">
                    Họ tên <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullname"
                    value={editingPatientData?.fullname || ''}
                    onChange={(e) => {
                      setEditingPatientData(prev =>
                        prev ? { ...prev, fullname: e.target.value } : null
                      )
                      // Clear error when user starts typing
                      if (patientErrors.fullname) {
                        setPatientErrors(prev => ({ ...prev, fullname: '' }))
                      }
                    }}
                    className={patientErrors.fullname ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {patientErrors.fullname && (
                    <p className="text-sm text-red-500">{patientErrors.fullname}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">
                    Giới tính <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={editingPatientData?.gender === true ? 'male' : 'female'}
                    onValueChange={(value) => setEditingPatientData(prev =>
                      prev ? { ...prev, gender: value === 'male' } : null
                    )}
                  >
                    <SelectTrigger className={patientErrors.gender ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                  {patientErrors.gender && (
                    <p className="text-sm text-red-500">{patientErrors.gender}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={editingPatientData?.phone || ''}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    title="Số điện thoại không thể chỉnh sửa"
                  />
                  <p className="text-xs text-gray-500">Số điện thoại không thể chỉnh sửa</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingPatientData?.email || ''}
                    onChange={(e) => {
                      setEditingPatientData(prev =>
                        prev ? { ...prev, email: e.target.value } : null
                      )
                      // Clear error when user starts typing
                      if (patientErrors.email) {
                        setPatientErrors(prev => ({ ...prev, email: '' }))
                      }
                    }}
                    className={patientErrors.email ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {patientErrors.email && (
                    <p className="text-sm text-red-500">{patientErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">
                    Ngày sinh <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editingPatientData?.dob ? formatDateForInput(editingPatientData.dob) : ''}
                    onChange={(e) => {
                      setEditingPatientData(prev =>
                        prev ? { ...prev, dob: e.target.value } : null
                      )
                      // Clear error when user starts typing
                      if (patientErrors.dob) {
                        setPatientErrors(prev => ({ ...prev, dob: '' }))
                      }
                    }}
                    className={patientErrors.dob ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {patientErrors.dob && (
                    <p className="text-sm text-red-500">{patientErrors.dob}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">
                    Địa chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={editingPatientData?.address || ''}
                    onChange={(e) => {
                      setEditingPatientData(prev =>
                        prev ? { ...prev, address: e.target.value } : null
                      )
                      // Clear error when user starts typing
                      if (patientErrors.address) {
                        setPatientErrors(prev => ({ ...prev, address: '' }))
                      }
                    }}
                    className={patientErrors.address ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {patientErrors.address && (
                    <p className="text-sm text-red-500">{patientErrors.address}</p>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="underlyingConditions">Tiền sử bệnh lý</Label>
                  <Textarea
                    id="underlyingConditions"
                    value={editingPatientData?.underlyingConditions || ''}
                    onChange={(e) => {
                      setEditingPatientData(prev =>
                        prev ? { ...prev, underlyingConditions: e.target.value } : null
                      )
                      // Clear error when user starts typing
                      if (patientErrors.underlyingConditions) {
                        setPatientErrors(prev => ({ ...prev, underlyingConditions: '' }))
                      }
                    }}
                    rows={3}
                    placeholder="Nhập tiền sử bệnh lý của bệnh nhân..."
                    className={patientErrors.underlyingConditions ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {patientErrors.underlyingConditions && (
                    <p className="text-sm text-red-500">{patientErrors.underlyingConditions}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isUpdatingPatient}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isUpdatingPatient ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Hủy
                </Button>
              </div>
            </form>
          ) : (
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
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <AuthGuard requiredRoles={['Receptionist', 'Assistant', 'Dentist']}>
      <StaffLayout userInfo={userInfo}>
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-gray-100"
                        title="Quay lại"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Hồ sơ điều trị nha khoa
                      </h2>
                    </div>
                    <p className="text-gray-600 mt-1">
                      Lịch sử đầy đủ về các phương pháp điều trị và thủ thuật nha khoa
                    </p>
                  </div>
                </div>

                {renderPatientInfo()}
              </CardHeader>

              <CardContent className="p-6">
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
                    onEdit={handleEditRecord}
                    onToggleDelete={handleToggleDelete}
                    onViewDetail={handleViewDetail}
                    patientId={patientId}
                    patientName={patient?.fullname || ""}
                  />
                )}
              </CardContent>
            </Card>

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

            {/* Treatment Record Detail Modal */}
            <TreatmentRecordDetail
              isOpen={detailModalOpen}
              onClose={handleCloseDetailModal}
              record={selectedDetailRecord}
            />

            <ConfirmModal
              isOpen={showConfirmModal}
              onClose={() => setShowConfirmModal(false)}
              onConfirm={handlePatientUpdateConfirmed}
              title="Xác nhận lưu thay đổi"
              message="Bạn có chắc chắn muốn cập nhật thông tin bệnh nhân?"
              confirmText="Lưu"
              confirmVariant="default"
              isLoading={isUpdatingPatient}
            />
          </div>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}

export default PatientTreatmentRecords