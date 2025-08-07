import { useState, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TimePicker } from "../ui/time-picker"
import { Save, UserPlus, Loader2 } from "lucide-react"
import type { TaskAssignment } from "@/types/task"
import { assignTaskApi } from "@/services/taskService"
import { toast } from "react-toastify"
import { DialogDescription } from "@radix-ui/react-dialog"

// Utility functions
const parseTime = (time: string): Date | undefined => {
  if (!time) return undefined

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/
  if (!timeRegex.test(time)) return undefined

  const [hours, minutes] = time.split(":").map(Number)
  const now = new Date()
  now.setHours(hours, minutes, 0, 0)
  return now
}

const formatDateToTimeString = (date?: Date): string => {
  if (!date) return ""
  return date.toTimeString().slice(0, 5)
}

const isTimeAfter = (timeA: string, timeB: string): boolean => {
  const [hA, mA] = timeA.split(":").map(Number)
  const [hB, mB] = timeB.split(":").map(Number)
  return hA * 60 + mA > hB * 60 + mB
}

// Types - Updated to match API response
interface Assistant {
  assistantId: number
  fullname: string
  phone: string
}

interface AssignTaskModalProps {
  onTaskAssign: (task: TaskAssignment) => void
  treatmentProgressID: number
  trigger?: React.ReactNode
  assistants: Assistant[]
}

type TaskAssignmentFormData = {
  assistantId: string
  progressName: string
  description: string
  startTime: string
  endTime: string
}

// Validation schema - Updated to remove availability check since API doesn't provide it
const createTaskAssignmentSchema = () => yup.object({
  assistantId: yup
    .string()
    .required("Vui lòng chọn trợ lý"),
  progressName: yup
    .string()
    .required("Vui lòng nhập tên nhiệm vụ")
    .min(3, "Tên nhiệm vụ phải có ít nhất 3 ký tự")
    .max(100, "Tên nhiệm vụ không được vượt quá 100 ký tự")
    .trim(),
  description: yup
    .string()
    .required("Vui lòng nhập mô tả nhiệm vụ")
    .min(10, "Mô tả phải có ít nhất 10 ký tự")
    .max(500, "Mô tả không được vượt quá 500 ký tự")
    .trim(),
  startTime: yup
    .string()
    .required("Vui lòng chọn giờ bắt đầu")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng giờ không hợp lệ"),
  endTime: yup
    .string()
    .required("Vui lòng chọn giờ kết thúc")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng giờ không hợp lệ")
    .test("after-start", "Giờ kết thúc phải sau giờ bắt đầu", function (value) {
      const { startTime } = this.parent
      return value && startTime ? isTimeAfter(value, startTime) : false
    }),
})

export function AssignTaskModal({
  onTaskAssign,
  trigger,
  treatmentProgressID,
  assistants
}: AssignTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<TaskAssignmentFormData | null>(null)

  const taskAssignmentSchema = createTaskAssignmentSchema()

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<TaskAssignmentFormData>({
    resolver: yupResolver(taskAssignmentSchema),
    mode: "onChange",
    defaultValues: {
      assistantId: "",
      progressName: "",
      description: "",
      startTime: "",
      endTime: "",
    },
  })

  const selectedAssistant = assistants.find(
    (a) => a.assistantId.toString() === watch("assistantId")
  )

  const handleSubmitConfirm = useCallback((data: TaskAssignmentFormData) => {
    setFormData(data)
    setConfirmOpen(true)
  }, [])

  const handleConfirmAssign = useCallback(async () => {
    if (!formData || !treatmentProgressID) return

    setIsSubmitting(true)
    try {
      const payload: TaskAssignment = {
        assistantId: parseInt(formData.assistantId, 10),
        treatmentProgressID,
        status: false,
        progressName: formData.progressName.trim(),
        description: formData.description.trim(),
        startTime: formData.startTime,
        endTime: formData.endTime,
      }

      await assignTaskApi(payload)
      toast.success("Phân công nhiệm vụ thành công!")
      onTaskAssign(payload)
      reset()
      setOpen(false)
      setConfirmOpen(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Đã xảy ra lỗi khi phân công nhiệm vụ")
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, treatmentProgressID, onTaskAssign, reset])

  const handleCancel = useCallback(() => {
    reset()
    setOpen(false)
    setConfirmOpen(false)
  }, [reset])

  const handleDialogChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      reset()
      setConfirmOpen(false)
    }
  }, [reset])

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Phân Công Nhiệm Vụ
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Phân Công Nhiệm Vụ
            </DialogTitle>
            <DialogDescription>
              Vui lòng điền đầy đủ thông tin để tạo nhiệm vụ mới.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSubmitConfirm)} className="space-y-4">
            {/* Assistant Selection */}
            <div className="space-y-2">
              <Label htmlFor="assistantId">Trợ lý *</Label>
              <Controller
                name="assistantId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      className={errors.assistantId ? "border-red-500" : ""}
                      aria-describedby={errors.assistantId ? "assistant-error" : undefined}
                    >
                      <SelectValue placeholder="Chọn trợ lý..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map((assistant) => (
                        <SelectItem
                          key={assistant.assistantId}
                          value={assistant.assistantId.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <span>{assistant.fullname}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assistantId && (
                <p id="assistant-error" className="text-red-500 text-sm">
                  {errors.assistantId.message}
                </p>
              )}

              {selectedAssistant && (
                <div className="bg-blue-50 p-3 rounded-lg mt-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg" alt={selectedAssistant.fullname} />
                      <AvatarFallback>{selectedAssistant.fullname[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{selectedAssistant.fullname}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedAssistant.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Task Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="progressName">Tên nhiệm vụ *</Label>
                <Controller
                  name="progressName"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      id="progressName"
                      placeholder="Nhập tên nhiệm vụ..."
                      className={errors.progressName ? "border-red-500" : ""}
                      aria-describedby={errors.progressName ? "progress-name-error" : undefined}
                    />
                  )}
                />
                {errors.progressName && (
                  <p id="progress-name-error" className="text-red-500 text-sm">
                    {errors.progressName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả nhiệm vụ *</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      id="description"
                      rows={3}
                      placeholder="Nhập mô tả chi tiết nhiệm vụ..."
                      className={errors.description ? "border-red-500" : ""}
                      aria-describedby={errors.description ? "description-error" : undefined}
                    />
                  )}
                />
                {errors.description && (
                  <p id="description-error" className="text-red-500 text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Time Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Giờ bắt đầu *</Label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      date={parseTime(field.value)}
                      setDate={(date) => field.onChange(formatDateToTimeString(date))}
                      className={errors.startTime ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">Giờ kết thúc *</Label>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      date={parseTime(field.value)}
                      setDate={(date) => field.onChange(formatDateToTimeString(date))}
                      className={errors.endTime ? "border-red-500" : ""}
                    />
                  )}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "Đang phân công..." : "Phân Công"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phân công</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Bạn có chắc chắn muốn giao nhiệm vụ này không?</p>
            {formData && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><strong>Nhiệm vụ:</strong> {formData.progressName}</p>
                <p><strong>Thời gian:</strong> {formData.startTime} - {formData.endTime}</p>
                <p><strong>Trợ lý:</strong> {selectedAssistant?.fullname}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button onClick={handleConfirmAssign} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang phân công...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}