// ✅ ViewTreatmentProgress.tsx
import { useEffect, useRef, useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { FileText, Plus, ArrowLeft, Search } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff/StaffLayout"
import { TreatmentProgressList } from "@/components/patient/TreatmentProgressList"
import { TreatmentProgressView } from "@/components/patient/TreatmentProgressView"
import NewTreatmentProgress from "@/components/patient/NewTreatmentProgress"
import { getTreatmentProgressById } from "@/services/treatmentProgressService"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ViewTreatmentProgress() {
  const [selectedProgress, setSelectedProgress] = useState<TreatmentProgress | null>(null)
  const [progressList, setProgressList] = useState<TreatmentProgress[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState("")

  const viewRef = useRef<HTMLDivElement>(null)
  const { treatmentRecordId } = useParams<{ treatmentRecordId: string }>()
  const [searchParams] = useSearchParams()
  const patientId = Number(searchParams.get("patientId"))
  const dentistId = Number(searchParams.get("dentistId"))

  const navigate = useNavigate()
  const { fullName, role, userId } = useAuth()

  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }

  const fetchData = async (recordId: number, scrollToLatest = false) => {
    setIsLoading(true)
    try {
      const data = await getTreatmentProgressById(recordId.toString())
      setProgressList(data)
      if (data.length > 0) {
        const latest = data[data.length - 1]
        setSelectedProgress(latest)

        if (scrollToLatest) {
          setTimeout(() => {
            viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 100)
        }
      } else {
        setSelectedProgress(null)
      }
    } catch (err) {
      console.error("Lỗi load tiến trình:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (treatmentRecordId) {
      fetchData(Number(treatmentRecordId))
    }
  }, [treatmentRecordId])

  const renderStatusBadge = (status?: string) => {
    const statusClass = {
      "Đang tiến hành": "bg-blue-100 text-blue-700",
      "Tạm dừng": "bg-yellow-100 text-yellow-700",
      "Đã huỷ": "bg-red-100 text-red-700",
      "Đã hoàn thành": "bg-green-100 text-green-700",
      "Chưa bắt đầu": "bg-gray-100 text-gray-600"
    }[status ?? "Chưa bắt đầu"]

    return (
      <span className={`px-4 py-2 text-base font-bold rounded shadow-sm ${statusClass}`}>
        {status || "Chưa rõ"}
      </span>
    )
  }

  const filteredProgressList = progressList.filter((item) =>
    `${item.progressName}`
      .toLowerCase()
      .includes(searchKeyword.toLowerCase())
  )

  return (
    <AuthGuard requiredRoles={["Administrator", "Owner", "Receptionist", "Assistant", "Dentist"]}>
      <StaffLayout userInfo={userInfo}>
        <div className="w-full px-4 md:px-8 lg:px-12 py-6 space-y-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => navigate(-1)}
                  className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Quay lại"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
                  <FileText className="h-6 w-6" /> Danh Sách Tiến Độ Điều Trị
                </h1>
              </div>
              <p className="text-gray-500 text-sm">Quản lý và theo dõi tiến độ điều trị của bệnh nhân</p>
              <p className="text-gray-400 text-sm">Theo dõi và cập nhật tiến độ điều trị của bệnh nhân theo thời gian</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {selectedProgress?.status && renderStatusBadge(selectedProgress.status)}
              {(selectedProgress || (progressList.length === 0 && treatmentRecordId)) && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Tạo Mới
                </button>
              )}
            </div>
          </div>

          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-xl">Tạo Tiến Trình Điều Trị</DialogTitle>
              </DialogHeader>
              {showCreateForm && treatmentRecordId && patientId && dentistId && (
                <NewTreatmentProgress
                  treatmentRecordID={Number(treatmentRecordId)}
                  patientID={Number(patientId)}
                  dentistID={Number(dentistId)}
                  onClose={() => setShowCreateForm(false)}
                  onCreated={(newProgress) => {
                    setSelectedProgress(newProgress)
                    fetchData(newProgress.treatmentRecordID, true)
                    setShowCreateForm(false)
                  }}
                />
              )}
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2" ref={viewRef}>
              {selectedProgress ? (
                <TreatmentProgressView progress={selectedProgress} />
              ) : (
                <div className="border rounded-lg p-6 text-center text-gray-500 bg-gray-50">
                  Vui lòng chọn một tiến độ điều trị từ danh sách bên phải để xem chi tiết.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  className="w-full border rounded-lg px-4 py-2 text-sm"
                  placeholder="Tìm theo bác sĩ hoặc bệnh nhân..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <button
                  type="button"
                  className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                  title="Tìm kiếm"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>

              <TreatmentProgressList
                data={filteredProgressList}
                loading={isLoading}
                onViewProgress={(progress) => {
                  setSelectedProgress(progress)
                  setShowCreateForm(false)
                  setTimeout(() => {
                    viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }, 100)
                }}
              />
            </div>
          </div>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
