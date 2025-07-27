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
      console.error("Error fetching treatment progress:", err)
      updateState({
        isLoading: false
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
      <span className={`px-3 py-1.5 text-sm font-semibold rounded-full shadow-sm ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={handleGoBack}
            className="mt-1 p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            title="Quay lại"
            aria-label="Quay lại trang trước"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <FileText className="h-6 w-6 text-blue-600" /> 
              Tiến Trình Điều Trị
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {state.progressList.length > 0 
                ? `${state.progressList.length} tiến trình điều trị` 
                : "Quản lý và theo dõi tiến độ điều trị"
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {state.selectedProgress?.status && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Trạng thái:</span>
              {renderStatusBadge(state.selectedProgress.status)}
            </div>
          )}
          
          {canCreateProgress && 
           !isPatient && 
           treatmentRecordId && (
            <button
              onClick={() => updateState({ showCreateForm: true })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              aria-label="Tạo tiến trình điều trị mới"
            >
              <Plus className="h-4 w-4" /> 
              Tạo Tiến Trình
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const renderCreateDialog = () => (
    <Dialog open={state.showCreateForm} onOpenChange={(open) => updateState({ showCreateForm: open })}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">Tạo Tiến Trình Điều Trị Mới</DialogTitle>
        </DialogHeader>
        {state.showCreateForm && treatmentRecordId && patientId && dentistId && (
          <div className="px-6 pb-6">
            <NewTreatmentProgress
              treatmentRecordID={Number(treatmentRecordId)}
              patientID={patientId}
              dentistID={dentistId}
              onClose={() => updateState({ showCreateForm: false })}
              onCreated={handleCreateSuccess}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  const renderProgressView = () => (
    <div className="bg-white rounded-lg shadow-sm border" ref={viewRef}>
      {state.selectedProgress ? (
        <TreatmentProgressView progress={state.selectedProgress} />
      ) : (
        <div className="p-8 text-center text-gray-500">
          <div className="bg-gray-50 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa chọn tiến trình
          </h3>
          <p className="text-gray-500">
            Vui lòng chọn một tiến trình từ danh sách để xem chi tiết
          </p>
        </div>
      )}
    </div>
  )

  const renderProgressList = () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Danh Sách Tiến Trình
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tất cả các tiến trình điều trị
        </p>
      </div>
      
      <div className="p-4">
        <TreatmentProgressList
          data={state.progressList}
          loading={state.isLoading}
          onViewProgress={handleViewProgress}
          highlightId={state.selectedProgress?.treatmentProgressID}
        />
      </div>
    </div>
  )

  const renderError = () => (
    <div className="px-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{state.error}</AlertDescription>
      </Alert>
    </div>
  )

  const renderLoadingSkeleton = () => (
    <div className="px-6 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-36" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderMainContent = () => {
    if (state.isLoading) {
      return renderLoadingSkeleton()
    }

    return (
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chi tiết tiến trình - Bên trái */}
          <div className="order-2 lg:order-1">
            {renderProgressView()}
          </div>
          
          {/* Danh sách tiến trình - Bên phải */}
          <div className="order-1 lg:order-2">
            {renderProgressList()}
          </div>
        </div>
      </div>
    )
  }

  const ContentComponent = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderHeader()}
      {renderCreateDialog()}
      {state.error && renderError()}
      {renderMainContent()}
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