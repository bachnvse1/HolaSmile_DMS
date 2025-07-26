import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { FileText, Plus, ArrowLeft, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff/StaffLayout"
import { PatientLayout } from "@/layouts/patient/PatientLayout"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

const TREATMENT_PROGRESS_STATUS = {
  "in-progress": { label: "Đang điều trị", className: "bg-blue-100 text-blue-800 border border-blue-200" },
  "canceled": { label: "Đã huỷ", className: "bg-red-100 text-red-800 border border-red-200" },
  "completed": { label: "Đã hoàn thành", className: "bg-green-100 text-green-800 border border-green-200" },
  "pending": { label: "Đã lên lịch", className: "bg-gray-100 text-gray-800 border border-gray-200" },
} as const

const ROLES_CAN_CREATE = ["Dentist"] as const

interface PageState {
  selectedProgress: TreatmentProgress | null
  progressList: TreatmentProgress[]
  showCreateForm: boolean
  isLoading: boolean
  error: string | null
}

const usePageState = () => {
  const [state, setState] = useState<PageState>({
    selectedProgress: null,
    progressList: [],
    showCreateForm: false,
    isLoading: true,
    error: null,
  })

  const updateState = useCallback((updates: Partial<PageState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  return { state, updateState }
}

export default function ViewTreatmentProgress() {
  const { state, updateState } = usePageState()
  
  const viewRef = useRef<HTMLDivElement>(null)
  const { treatmentRecordId } = useParams<{ treatmentRecordId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { fullName, role, userId } = useAuth()

  const isPatient = role === "Patient"
  const canCreateProgress = ROLES_CAN_CREATE.includes(role as any)
  const patientId = Number(searchParams.get("patientId"))
  const dentistId = Number(searchParams.get("dentistId"))

  const userInfo = useMemo(() => ({
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }), [userId, fullName, role])

  const fetchData = useCallback(async (recordId: number, scrollToLatest = false) => {
    updateState({ isLoading: true, error: null })
    
    try {
      const data = await getTreatmentProgressById(recordId.toString())
      const latestProgress = data.length > 0 ? data[data.length - 1] : null
      
      updateState({
        progressList: data,
        selectedProgress: latestProgress,
        isLoading: false,
      })

      if (scrollToLatest && latestProgress) {
        setTimeout(() => {
          viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      }
    } catch (err) {
      console.error("Lỗi load tiến trình:", err)
      updateState({
        error:
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as any).response?.data?.message === "string"
            ? (err as any).response.data.message
            : "Không thể tải dữ liệu tiến trình điều trị",
        isLoading: false,
      })
    }
  }, [updateState])

  useEffect(() => {
    if (treatmentRecordId) {
      fetchData(Number(treatmentRecordId))
    }
  }, [treatmentRecordId, fetchData])

  const handleCreateSuccess = useCallback((newProgress: TreatmentProgress) => {
    updateState({
      selectedProgress: newProgress,
      showCreateForm: false,
    })
    fetchData(newProgress.treatmentRecordID, true)
  }, [updateState, fetchData])

  const handleViewProgress = useCallback((progress: TreatmentProgress) => {
    updateState({
      selectedProgress: progress,
      showCreateForm: false,
    })
    setTimeout(() => {
      viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }, [updateState])

  const handleGoBack = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const renderStatusBadge = (status?: string) => {
    const statusInfo = TREATMENT_PROGRESS_STATUS[status as keyof typeof TREATMENT_PROGRESS_STATUS] ?? {
      label: status ?? "Không rõ",
      className: "bg-gray-100 text-gray-800 border border-gray-200",
    }
    
    return (
      <span className={`px-4 py-2 text-base font-bold rounded shadow-sm ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const renderHeader = () => (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            title="Quay lại"
            aria-label="Quay lại trang trước"
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
        {state.selectedProgress?.status && renderStatusBadge(state.selectedProgress.status)}
        {canCreateProgress && 
         !isPatient && 
         (state.selectedProgress || (state.progressList.length === 0 && treatmentRecordId)) && (
          <button
            onClick={() => updateState({ showCreateForm: true })}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Tạo tiến trình điều trị mới"
          >
            <Plus className="h-4 w-4" /> Tạo Mới
          </button>
        )}
      </div>
    </div>
  )

  const renderCreateDialog = () => (
    <Dialog open={state.showCreateForm} onOpenChange={(open) => updateState({ showCreateForm: open })}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl">Tạo Tiến Trình Điều Trị</DialogTitle>
        </DialogHeader>
        {state.showCreateForm && treatmentRecordId && patientId && dentistId && (
          <NewTreatmentProgress
            treatmentRecordID={Number(treatmentRecordId)}
            patientID={patientId}
            dentistID={dentistId}
            onClose={() => updateState({ showCreateForm: false })}
            onCreated={handleCreateSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )

  const renderProgressView = () => (
    <div className="xl:col-span-2" ref={viewRef}>
      {state.selectedProgress ? (
        <TreatmentProgressView progress={state.selectedProgress} />
      ) : (
        <div className="border rounded-lg p-6 text-center text-gray-500 bg-gray-50">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Vui lòng chọn một tiến độ điều trị từ danh sách bên phải để xem chi tiết.</p>
        </div>
      )}
    </div>
  )

  // Fixed search and list rendering
  const renderSearchAndList = () => (
    <div className="space-y-4">
      <TreatmentProgressList
        data={state.progressList}
        loading={state.isLoading}
        onViewProgress={handleViewProgress}
      />
    </div>
  )

  const renderError = () => (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{state.error}</AlertDescription>
    </Alert>
  )

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  )

  const ContentComponent = () => (
    <div className="w-full px-4 md:px-8 lg:px-12 py-6 space-y-6">
      {renderHeader()}
      {renderCreateDialog()}
      {state.error && renderError()}
      
      {state.isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {renderProgressView()}
          {renderSearchAndList()}
        </div>
      )}
    </div>
  )

  return (
    <AuthGuard requiredRoles={["Receptionist", "Assistant", "Dentist", "Patient"]}>
      {isPatient ? (
        <PatientLayout userInfo={userInfo}>
          <ContentComponent />
        </PatientLayout>
      ) : (
        <StaffLayout userInfo={userInfo}>
          <ContentComponent />
        </StaffLayout>
      )}
    </AuthGuard>
  )
}