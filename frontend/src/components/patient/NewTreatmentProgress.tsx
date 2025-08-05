import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useState, useCallback, useMemo } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X, AlertCircle, FileText, Clock, User } from "lucide-react"
import { format, isBefore, startOfToday } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createTreatmentProgress } from "@/services/treatmentProgressService"

const STATUS_OPTIONS = [
    { value: "pending", label: "Đã lên lịch", icon: Clock, color: "text-gray-600" },
    { value: "in-progress", label: "Đang điều trị", icon: FileText, color: "text-blue-600" },
    { value: "completed", label: "Đã hoàn thành", icon: User, color: "text-green-600" },
    { value: "canceled", label: "Đã huỷ", icon: X, color: "text-red-600" },
] as const

const DEFAULT_FORM_VALUES = {
    progressName: "",
    progressContent: "",
    status: "in-progress" as const, 
    duration: undefined as number | undefined,
    description: "",
}

const toVietnamISOString = (date: Date): string => {
    const vietnamOffset = -date.getTimezoneOffset()
    const localTime = new Date(date.getTime() + vietnamOffset * 60000)
    return localTime.toISOString()
}

const getCurrentDateTime = () => {
    const now = new Date()
    const date = now
    const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    return { date, time }
}

const validationSchema = yup.object({
    progressName: yup
        .string()
        .required("Tên tiến trình không được bỏ trống")
        .min(3, "Tên tiến trình phải có ít nhất 3 ký tự")
        .max(100, "Tên tiến trình không được vượt quá 100 ký tự"),
    progressContent: yup
        .string()
        .required("Nội dung không được bỏ trống")
        .min(10, "Nội dung phải có ít nhất 10 ký tự")
        .max(500, "Nội dung không được vượt quá 500 ký tự"),
    status: yup
        .string()
        .required("Trạng thái không được bỏ trống")
        .oneOf(STATUS_OPTIONS.map(opt => opt.value), "Trạng thái không hợp lệ"),
    duration: yup
        .number()
        .typeError("Thời gian phải là số")
        .positive("Thời gian phải lớn hơn 0")
        .max(480, "Thời gian không được vượt quá 480 phút (8 giờ)")
        .required("Thời gian không được bỏ trống"),
    description: yup
        .string()
        .required("Mô tả không được bỏ trống")
        .min(10, "Mô tả phải có ít nhất 10 ký tự")
        .max(1000, "Mô tả không được vượt quá 1000 ký tự"),
})

type FormData = yup.InferType<typeof validationSchema>

interface Props {
    treatmentRecordID: number
    patientID: number
    dentistID: number
    onClose: () => void
    onCreated: (data: any) => void
}

interface DateTimeState {
    selectedDate: Date | undefined
    selectedTime: string
    error: string | null
}

const useDateTimeState = () => {
    const [state, setState] = useState<DateTimeState>(() => {
        const { date, time } = getCurrentDateTime()
        return {
            selectedDate: date,
            selectedTime: time,
            error: null,
        }
    })

    const updateState = useCallback((updates: Partial<DateTimeState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }, [])

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
        if (!time) {
            updateState({ error: "Vui lòng chọn thời gian" })
            return
        }
        updateState({ 
            selectedTime: time,
            error: null,
        })
    }, [updateState])

    return {
        state,
        updateState,
        handleDateSelect,
        handleTimeChange,
    }
}

export default function NewTreatmentProgress({
    treatmentRecordID,
    patientID,
    dentistID,
    onClose,
    onCreated,
}: Props) {
    const { state: dateTimeState, updateState, handleDateSelect, handleTimeChange } = useDateTimeState()
    const [submitError, setSubmitError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting, isValid },
    } = useForm<FormData>({
        resolver: yupResolver(validationSchema),
        defaultValues: DEFAULT_FORM_VALUES,
        mode: "onChange",
    })

    const watchedValues = watch()

    const inProgressStatus = STATUS_OPTIONS.find(opt => opt.value === "in-progress")!

    const canSubmit = useMemo(() => {
        return isValid && 
               dateTimeState.selectedDate && 
               dateTimeState.selectedTime && 
               !dateTimeState.error &&
               !isSubmitting
    }, [isValid, dateTimeState.selectedDate, dateTimeState.selectedTime, dateTimeState.error, isSubmitting])

    const handleReset = useCallback(() => {
        reset(DEFAULT_FORM_VALUES)
        const { date, time } = getCurrentDateTime()
        updateState({
            selectedDate: date,
            selectedTime: time,
            error: null,
        })
        setSubmitError(null)
    }, [reset, updateState])

    const onSubmit = async (data: FormData) => {
        setSubmitError(null)

        if (!dateTimeState.selectedDate || !dateTimeState.selectedTime) {
            updateState({ error: "Vui lòng chọn ngày và giờ kết thúc" })
            return
        }

        const [hour, minute] = dateTimeState.selectedTime.split(":").map(Number)
        const combinedDate = new Date(dateTimeState.selectedDate)
        combinedDate.setHours(hour, minute, 0, 0)

        if (isBefore(combinedDate, new Date())) {
            updateState({ error: "Thời gian kết thúc không thể ở quá khứ" })
            return
        }

        const progressData = {
            treatmentRecordID,
            patientID,
            dentistID,
            ...data,
            endTime: toVietnamISOString(combinedDate),
            note: "",
        }

        try {
            const result = await createTreatmentProgress(progressData)
            toast.success(result.message || "Tạo tiến trình thành công")
            
            onCreated(result.data || progressData)
            
            setTimeout(() => {
                onClose()
            }, 500)

        } catch (err) {
            console.error("Error creating treatment progress:", err)
            const errorMessage = err instanceof Error ? err.message : "Lỗi khi tạo tiến trình"
            setSubmitError(errorMessage)
            toast.error(errorMessage)
        }
    }

    const renderHeader = () => (
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Tạo Tiến Trình Điều Trị Mới
            </CardTitle>
            <p className="text-sm text-gray-600">
                Điền thông tin chi tiết để tạo tiến trình điều trị mới cho bệnh nhân
            </p>
        </CardHeader>
    )

    const renderErrorAlert = () => (
        (submitError || dateTimeState.error) && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    {submitError || dateTimeState.error}
                </AlertDescription>
            </Alert>
        )
    )

    const renderBasicFields = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="progressName">
                    Tên tiến trình *
                    <span className="text-xs text-gray-500 ml-1">(3-100 ký tự)</span>
                </Label>
                <Input
                    id="progressName"
                    {...register("progressName")}
                    placeholder="Ví dụ: Khám tổng quát, Điều trị tủy, Nhổ răng..."
                    className={errors.progressName ? "border-red-500" : ""}
                />
                {errors.progressName && (
                    <p className="text-red-500 text-sm mt-1">{errors.progressName.message}</p>
                )}
            </div>

            <div>
                <Label htmlFor="progressContent">
                    Nội dung *
                    <span className="text-xs text-gray-500 ml-1">(10-500 ký tự)</span>
                </Label>
                <Textarea
                    id="progressContent"
                    rows={3}
                    {...register("progressContent")}
                    placeholder="Mô tả chi tiết về nội dung điều trị, các bước thực hiện..."
                    className={errors.progressContent ? "border-red-500" : ""}
                />
                {errors.progressContent && (
                    <p className="text-red-500 text-sm mt-1">{errors.progressContent.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    {watchedValues.progressContent?.length || 0}/500 ký tự
                </p>
            </div>
        </div>
    )

    const renderStatusAndDuration = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label>Trạng thái</Label>
                <div className="p-3 border rounded-md bg-gray-50 flex items-center gap-2">
                    <inProgressStatus.icon className={`h-4 w-4 ${inProgressStatus.color}`} />
                    <span className="text-sm font-medium">{inProgressStatus.label}</span>
                </div>
            </div>

            <div>
                <Label htmlFor="duration">
                    Thời gian (phút) *
                    <span className="text-xs text-gray-500 ml-1">(1-480 phút)</span>
                </Label>
                <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="480"
                    {...register("duration")}
                    placeholder="Ví dụ: 30, 60, 90..."
                    className={errors.duration ? "border-red-500" : ""}
                />
                {errors.duration && (
                    <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    Thời gian dự kiến hoàn thành (tối đa 8 giờ)
                </p>
            </div>
        </div>
    )

    const renderDescription = () => (
        <div>
            <Label htmlFor="description">
                Mô tả chi tiết *
                <span className="text-xs text-gray-500 ml-1">(10-1000 ký tự)</span>
            </Label>
            <Textarea
                id="description"
                rows={4}
                {...register("description")}
                placeholder="Mô tả chi tiết về quy trình điều trị, lưu ý đặc biệt, kết quả mong đợi..."
                className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
                {watchedValues.description?.length || 0}/1000 ký tự
            </p>
        </div>
    )

    const renderDateTime = () => (
        <div>
            <Label>Thời gian kết thúc dự kiến *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label className="text-sm text-gray-600">Ngày</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`w-full justify-start text-left font-normal ${
                                    dateTimeState.error ? "border-red-500" : ""
                                }`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateTimeState.selectedDate
                                    ? format(dateTimeState.selectedDate, "dd/MM/yyyy")
                                    : "Chọn ngày"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dateTimeState.selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => isBefore(date, startOfToday())}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div>
                    <Label className="text-sm text-gray-600">Giờ</Label>
                    <Input
                        type="time"
                        value={dateTimeState.selectedTime}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className={dateTimeState.error ? "border-red-500" : ""}
                    />
                </div>
            </div>
            {dateTimeState.error && (
                <p className="text-red-500 text-sm mt-1">{dateTimeState.error}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
                Thời gian dự kiến hoàn thành điều trị
            </p>
        </div>
    )

    const renderActionButtons = () => (
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
            <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 sm:flex-initial"
            >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? "Đang tạo..." : "Tạo Tiến Trình"}
            </Button>
            
            <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial"
            >
                <X className="h-4 w-4 mr-2" />
                Đặt Lại
            </Button>
            
            <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial"
            >
                <X className="h-4 w-4 mr-2" />
                Hủy
            </Button>
        </div>
    )

    return (
        <div className="space-y-6">
            <Card>
                {renderHeader()}
                <CardContent className="space-y-6">
                    {renderErrorAlert()}
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {renderBasicFields()}
                        {renderStatusAndDuration()}
                        {renderDescription()}
                        {renderDateTime()}
                        {renderActionButtons()}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}