import { useEffect, useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  CalendarDays,
  Edit,
  Save,
  User,
  UserCheck,
  X,
  CalendarIcon,
  Clock,
  AlertCircle,
  Activity,
  Stethoscope,
  Timer,
  UserX,
  FileText,
  ClipboardList,
  StickyNote,
} from "lucide-react"
import { format, isValid, isBefore, startOfToday } from "date-fns"
import { formatVietnameseDateFull } from "@/utils/date"
import type { TreatmentProgress } from "@/types/treatmentProgress"
import { updateTreatmentProgress } from "@/services/treatmentProgressService"
import { toast } from "react-toastify"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button2"
import { Label } from "@radix-ui/react-label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/useAuth"

// Constants
const STATUS_OPTIONS = [
  { value: "pending", label: "Đã lên lịch", color: "text-gray-600", icon: CalendarIcon },
  { value: "in-progress", label: "Đang điều trị", color: "text-blue-600", icon: Activity },
  { value: "completed", label: "Đã hoàn thành", color: "text-gray-800", icon: UserCheck },
  { value: "canceled", label: "Đã huỷ", color: "text-gray-600", icon: UserX },
] as const

const STATUS_COLORS = {
  pending: "bg-gray-50 text-gray-800 border-gray-200",
  "in-progress": "bg-blue-50 text-blue-800 border-blue-200",
  completed: "bg-gray-100 text-gray-800 border-gray-300",
  canceled: "bg-gray-50 text-gray-700 border-gray-200",
} as const

// Validation schema
const progressSchema = yup.object({
  progressName: yup.string().required("Tên tiến trình không được bỏ trống"),
  progressContent: yup.string().required("Nội dung không được bỏ trống"),
  status: yup.string().required("Trạng thái không được bỏ trống"),
  duration: yup
    .number()
    .typeError("Thời gian phải là số")
    .positive("Thời gian phải lớn hơn 0")
    .required("Thời gian không được bỏ trống"),
  description: yup.string().required("Mô tả không được bỏ trống"),
  note: yup.string().required("Ghi chú không được bỏ trống"),
})

type FormData = yup.InferType<typeof progressSchema>

// Types
interface Props {
  progress: TreatmentProgress
}

interface EditState {
  isEditing: boolean
  selectedDate: Date | undefined
  selectedTime: string
  error: string | null
}

// Utility functions
const toVietnamISOString = (date: Date): string => {
  const offset = date.getTimezoneOffset()
  const localTime = new Date(date.getTime() - offset * 60000)
  return localTime.toISOString()
}

const parseEndTime = (endTime: string | null) => {
  if (!endTime) return { date: undefined, time: "" }
  
  const dt = new Date(endTime)
  if (!isValid(dt)) return { date: undefined, time: "" }
  
  const date = dt
  const time = `${dt.getHours().toString().padStart(2, "0")}:${dt.getMinutes().toString().padStart(2, "0")}`
  
  return { date, time }
}

// Custom hooks
const useEditState = (progress: TreatmentProgress) => {
  const [state, setState] = useState<EditState>({
    isEditing: false,
    selectedDate: undefined,
    selectedTime: "",
    error: null,
  })

  const updateState = useCallback((updates: Partial<EditState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const initializeDateTime = useCallback(() => {
    const { date, time } = parseEndTime(progress.endTime ?? null)
    updateState({
      selectedDate: date,
      selectedTime: time,
      error: null,
    })
  }, [progress.endTime, updateState])

  const startEditing = useCallback(() => {
    initializeDateTime()
    updateState({ isEditing: true })
  }, [initializeDateTime, updateState])

  const cancelEditing = useCallback(() => {
    updateState({
      isEditing: false,
      error: null,
    })
  }, [updateState])

  return {
    state,
    updateState,
    initializeDateTime,
    startEditing,
    cancelEditing,
  }
}

export function TreatmentProgressView({ progress }: Props) {
  const { role } = useAuth()
  const { state: editState, updateState, startEditing, cancelEditing } = useEditState(progress)
  
  const isPatient = role === "Patient"
  const canEdit = !isPatient && role && ["Administrator", "Owner", "Dentist"].includes(role)

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: yupResolver(progressSchema),
    defaultValues: progress,
  })

  // Computed values
  const statusInfo = useMemo(() => {
    const option = STATUS_OPTIONS.find(opt => opt.value === progress.status)
    return option || { value: progress.status, label: progress.status || "Không rõ", color: "text-gray-600", icon: AlertCircle }
  }, [progress.status])

  const formattedEndTime = useMemo(() => {
    if (!progress.endTime || !isValid(new Date(progress.endTime))) {
      return "Chưa đặt thời gian"
    }
    return format(new Date(progress.endTime), "dd/MM/yyyy HH:mm")
  }, [progress.endTime])

  // Effects
  useEffect(() => {
    reset(progress)
  }, [progress, reset])

  useEffect(() => {
    if (editState.isEditing) {
      const { date, time } = parseEndTime(progress.endTime ?? null)
      updateState({
        selectedDate: date,
        selectedTime: time,
      })
    }
  }, [editState.isEditing, progress.endTime, updateState])

  // Event handlers
  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date && isBefore(date, startOfToday())) {
      updateState({ error: "Không thể chọn ngày trong quá khứ" })
      return
    }
    updateState({ 
      selectedDate: date,
      error: null,
    })
  }, [updateState])

  const handleTimeChange = useCallback((time: string) => {
    updateState({ 
      selectedTime: time,
      error: null,
    })
  }, [updateState])

  const onSubmit = async (formData: FormData) => {
    if (!editState.selectedDate || !editState.selectedTime) {
      updateState({ error: "Vui lòng chọn ngày và giờ kết thúc" })
      return
    }

    const [hour, minute] = editState.selectedTime.split(":").map(Number)
    const combinedDate = new Date(editState.selectedDate)
    combinedDate.setHours(hour, minute)

    const updateData = {
      ...progress,
      ...formData,
      endTime: toVietnamISOString(combinedDate),
    }

    try {
      updateState({ error: null })
      const result = await updateTreatmentProgress(updateData)
      toast.success(result.message || "Cập nhật tiến trình thành công")
      cancelEditing()
      
      // Reload page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi khi cập nhật tiến trình"
      updateState({ error: errorMessage })
      toast.error(errorMessage)
    }
  }

  // Render functions
  const renderHeader = () => (
    <div className="bg-gradient-to-r from-blue-200 to-blue-300 text-black rounded-t-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold truncate">{progress.progressName}</h1>
            <p className="text-black-100 text-xs">Chi tiết tiến trình điều trị</p>
          </div>
        </div>
        
        {canEdit && !editState.isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={startEditing}
            className="bg-white/10 border-white/20 text-black hover:bg-white/20 hover:text-black text-xs px-3 py-1"
          >
            <Edit className="h-3 w-3 mr-1" />
            Chỉnh Sửa
          </Button>
        )}
      </div>
    </div>
  )

  const renderProgressInfo = () => {
    const StatusIcon = statusInfo.icon
    
    return (
      <div className="bg-white rounded-lg border p-3 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-center">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${STATUS_COLORS[progress.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.pending}`}>
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </div>
        </div>

        {/* Info Grid - 2x2 layout */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">Bệnh nhân</p>
                <p className="font-semibold text-gray-800 text-xs truncate" title={progress.patientName}>
                  {progress.patientName}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
            <div className="flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">Bác sĩ</p>
                <p className="font-semibold text-blue-700 text-xs truncate" title={progress.dentistName}>
                  {progress.dentistName}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">Thời gian</p>
                <p className="font-semibold text-gray-800 text-xs">{progress.duration || "--"} phút</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-3 w-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">Kết thúc</p>
                <p className="font-semibold text-gray-800 text-xs truncate" title={formattedEndTime}>
                  {formattedEndTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Details - Compact */}
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded border">
            <div className="flex items-start gap-2">
              <FileText className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">Nội dung điều trị</p>
                <p className="text-xs text-gray-800 line-clamp-2" title={progress.progressContent}>
                  {progress.progressContent}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-2 rounded border">
            <div className="flex items-start gap-2">
              <ClipboardList className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 mb-1">Mô tả chi tiết</p>
                <p className="text-xs text-gray-800 line-clamp-2" title={progress.description}>
                  {progress.description}
                </p>
              </div>
            </div>
          </div>
          
          {progress.note && (
            <div className="bg-gray-100 p-2 rounded border border-gray-300">
              <div className="flex items-start gap-2">
                <StickyNote className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 mb-1">Ghi chú</p>
                  <p className="text-xs text-gray-800 line-clamp-2" title={progress.note}>
                    {progress.note}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Info - Compact */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t">
          <div className="flex items-center gap-1 p-1 bg-gray-50 rounded">
            <CalendarDays className="h-3 w-3 text-gray-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-gray-600">Tạo lúc</p>
              <p className="text-xs font-medium truncate" title={
                progress.createdAt 
                  ? formatVietnameseDateFull(new Date(progress.createdAt))
                  : "Không rõ"
              }>
                {progress.createdAt 
                  ? format(new Date(progress.createdAt), "dd/MM/yyyy")
                  : "Không rõ"
                }
              </p>
            </div>
          </div>
          
          {progress.updatedAt && (
            <div className="flex items-center gap-1 p-1 bg-gray-50 rounded">
              <Clock className="h-3 w-3 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600">Cập nhật</p>
                <p className="text-xs font-medium truncate" title={formatVietnameseDateFull(new Date(progress.updatedAt))}>
                  {format(new Date(progress.updatedAt), "dd/MM/yyyy")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderEditForm = () => (
    <div className="bg-white rounded-lg border p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Edit className="h-4 w-4 text-blue-600" />
        <h3 className="text-base font-semibold">Chỉnh Sửa Tiến Trình</h3>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {editState.error && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{editState.error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="progressName" className="text-xs font-medium">
              Tên tiến trình *
            </Label>
            <Input
              id="progressName"
              {...register("progressName")}
              className="focus:ring-blue-500 focus:border-blue-500 text-sm h-8"
            />
            {errors.progressName && (
              <p className="text-red-500 text-xs">{errors.progressName.message}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="duration" className="text-xs font-medium">
              Thời gian (phút) *
            </Label>
            <Input
              id="duration"
              type="number"
              {...register("duration")}
              className="focus:ring-blue-500 focus:border-blue-500 text-sm h-8"
            />
            {errors.duration && (
              <p className="text-red-500 text-xs">{errors.duration.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="progressContent" className="text-xs font-medium">
            Nội dung điều trị *
          </Label>
          <Textarea
            id="progressContent"
            {...register("progressContent")}
            rows={2}
            className="focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          />
          {errors.progressContent && (
            <p className="text-red-500 text-xs">{errors.progressContent.message}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="status" className="text-xs font-medium">
              Trạng thái *
            </Label>
            <select
              id="status"
              {...register("status")}
              className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 h-8"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-red-500 text-xs">{errors.status.message}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs font-medium">
              Thời gian kết thúc *
            </Label>
            <div className="flex gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 justify-start text-left font-normal text-xs h-8 px-2"
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {editState.selectedDate 
                      ? format(editState.selectedDate, "dd/MM") 
                      : "Chọn ngày"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={editState.selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => isBefore(date, startOfToday())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                type="time"
                value={editState.selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="flex-1 text-xs h-8"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="description" className="text-xs font-medium">
            Mô tả chi tiết *
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={2}
            className="focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          />
          {errors.description && (
            <p className="text-red-500 text-xs">{errors.description.message}</p>
          )}
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="note" className="text-xs font-medium">
            Ghi chú
          </Label>
          <Textarea
            id="note"
            {...register("note")}
            rows={2}
            className="bg-gray-50 border-gray-200 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          />
        </div>
        
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={cancelEditing}
            disabled={isSubmitting}
            className="text-xs h-8 px-3"
          >
            <X className="h-3 w-3 mr-1" />
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-xs h-8 px-3"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </form>
    </div>
  )

  return (
    <div className="w-full h-full space-y-1">
      {renderHeader()}
      
      {editState.isEditing ? (
        renderEditForm()
      ) : (
        renderProgressInfo()
      )}
    </div>
  )
}