import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { TimePicker } from "../ui/time-picker"
import { Save, UserPlus } from "lucide-react"
import type { TaskAssignment } from "@/types/task"
import { assignTaskApi } from "@/services/taskService"
import { toast } from "react-toastify"

const parseTime = (time: string): Date | undefined => {
  if (!time) return undefined
  const [hours, minutes] = time.split(":").map(Number)
  const now = new Date()
  now.setHours(hours)
  now.setMinutes(minutes)
  now.setSeconds(0)
  now.setMilliseconds(0)
  return now
}

const formatDateToTimeString = (date?: Date): string => {
  if (!date) return ""
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

const ensureTimeFormat = (time: string): string => {
  return time.trim().length === 5 ? `${time}:00` : time
}

const isTimeAfter = (timeA: string, timeB: string): boolean => {
  const [hA, mA] = timeA.split(":").map(Number)
  const [hB, mB] = timeB.split(":").map(Number)
  return hA * 60 + mA > hB * 60 + mB
}

const taskAssignmentSchema = yup.object({
  assistantId: yup
    .string()
    .required("Vui lòng chọn trợ lý")
    .test("is-available", "Trợ lý này hiện không có sẵn", (value) => {
      const assistant = assistants.find(a => a.assistantId.toString() === value)
      return assistant?.isAvailable ?? false
    }),
  progressName: yup
    .string().required("Vui lòng nhập tên nhiệm vụ").min(3).max(100),
  description: yup
    .string().required("Vui lòng nhập mô tả nhiệm vụ").min(10).max(500),
  startTime: yup
    .string().required("Vui lòng chọn giờ bắt đầu")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng giờ không hợp lệ"),
  endTime: yup
    .string().required("Vui lòng chọn giờ kết thúc")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Định dạng giờ không hợp lệ")
    .test("after-start", "Giờ kết thúc phải sau giờ bắt đầu", function (value) {
      const { startTime } = this.parent
      return value && startTime ? isTimeAfter(value, startTime) : false
    }),
})

type TaskAssignmentFormData = yup.InferType<typeof taskAssignmentSchema>

interface Assistant {
  assistantId: number
  name: string
  specialty: string
  email: string
  phone: string
  isAvailable: boolean
}

const assistants: Assistant[] = [
  { assistantId: 1, name: "Nguyễn Thị Lan", specialty: "Trợ lý nha khoa", email: "lan.nguyen@clinic.com", phone: "0333111222", isAvailable: true },
  { assistantId: 2, name: "Trần Văn Minh", specialty: "Kỹ thuật viên", email: "minh.tran@clinic.com", phone: "0333222333", isAvailable: true },
  { assistantId: 3, name: "Lê Thị Hoa", specialty: "Điều dưỡng", email: "hoa.le@clinic.com", phone: "0333333444", isAvailable: false },
  { assistantId: 4, name: "Phạm Văn Đức", specialty: "Trợ lý phẫu thuật", email: "duc.pham@clinic.com", phone: "0333444555", isAvailable: true },
]

interface AssignTaskModalProps {
  onTaskAssign(task: TaskAssignment): void
  treatmentProgressID: number
  trigger?: React.ReactNode
}

export function AssignTaskModal({ onTaskAssign, trigger, treatmentProgressID }: AssignTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formData, setFormData] = useState<TaskAssignmentFormData | null>(null)

  const handleSubmitConfirm = (data: TaskAssignmentFormData) => {
    setFormData(data)
    setConfirmOpen(true)
  }

  const handleConfirmAssign = async () => {
    if (!formData || !treatmentProgressID) return
    setIsSubmitting(true)

    try {
      const payload: TaskAssignment = {
        assistantId: parseInt(formData.assistantId, 10),
        treatmentProgressID,
        status: false,
        progressName: formData.progressName,
        description: formData.description,
        startTime: ensureTimeFormat(formData.startTime),
        endTime: ensureTimeFormat(formData.endTime),
      }

      await assignTaskApi(payload)
      toast.success("Phân công nhiệm vụ thành công!")
      onTaskAssign(payload)
      reset()
      setOpen(false)

    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi")
    } finally {
      setIsSubmitting(false)
      setConfirmOpen(false)
    }
  }

  const {
    control, handleSubmit, watch, reset,
    formState: { errors, isValid },
  } = useForm<TaskAssignmentFormData>({
    resolver: yupResolver(taskAssignmentSchema),
    mode: "onChange",
    defaultValues: {
      assistantId: "", progressName: "", description: "", startTime: "", endTime: "",
    },
  })

  const selectedAssistant = assistants.find(a => a.assistantId.toString() === watch("assistantId"))

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Phân Công Nhiệm Vụ</Button>}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />Phân Công Nhiệm Vụ</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSubmitConfirm)} className="space-y-4">
            {/* Chọn trợ lý */}
            <div className="space-y-2">
              <Label>Trợ lý *</Label>
              <Controller
                name="assistantId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.assistantId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Chọn trợ lý..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map((a) => (
                        <SelectItem key={a.assistantId} value={a.assistantId.toString()} disabled={!a.isAvailable}>
                          <div className="flex items-center gap-2">
                            <span>{a.name}</span>
                            <Badge variant="outline" className="text-xs">{a.specialty}</Badge>
                            {!a.isAvailable && <Badge variant="destructive" className="text-xs">Không có sẵn</Badge>}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assistantId && <p className="text-red-500 text-sm">{errors.assistantId.message}</p>}

              {selectedAssistant && (
                <div className="bg-blue-50 p-3 rounded-lg mt-2">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src="/placeholder.svg" /><AvatarFallback>{selectedAssistant.name[0]}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold text-sm">{selectedAssistant.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedAssistant.email} • {selectedAssistant.phone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Chi tiết nhiệm vụ */}
            <div className="space-y-2">
              <Label>Tên nhiệm vụ *</Label>
              <Controller name="progressName" control={control} render={({ field }) => (
                <Input {...field} placeholder="Nhập tên nhiệm vụ..." className={errors.progressName ? "border-red-500" : ""} />
              )} />
              {errors.progressName && <p className="text-red-500 text-sm">{errors.progressName.message}</p>}

              <Label>Mô tả nhiệm vụ *</Label>
              <Controller name="description" control={control} render={({ field }) => (
                <Textarea {...field} rows={3} placeholder="Nhập mô tả..." className={errors.description ? "border-red-500" : ""} />
              )} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <Separator />

            {/* Thời gian */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Giờ bắt đầu *</Label>
                <Controller name="startTime" control={control} render={({ field }) => (
                  <TimePicker
                    date={parseTime(field.value)}
                    setDate={(date) => field.onChange(formatDateToTimeString(date))}
                    className={errors.startTime ? "border-red-500" : ""}
                  />
                )} />
                {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime.message}</p>}
              </div>

              <div>
                <Label>Giờ kết thúc *</Label>
                <Controller name="endTime" control={control} render={({ field }) => (
                  <TimePicker
                    date={parseTime(field.value)}
                    setDate={(date) => field.onChange(formatDateToTimeString(date))}
                    className={errors.endTime ? "border-red-500" : ""}
                  />
                )} />
                {errors.endTime && <p className="text-red-500 text-sm">{errors.endTime.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Hủy</Button>
              <Button type="submit" disabled={!isValid || isSubmitting} className="flex items-center gap-2">
                <Save className="h-4 w-4" /> {isSubmitting ? "Đang phân công..." : "Phân Công"}
              </Button>
            </div>
          </form>


        </DialogContent>
      </Dialog>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận phân công</DialogTitle>
          </DialogHeader>
          <p>Bạn có chắc chắn muốn giao nhiệm vụ này?</p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Hủy</Button>
            <Button onClick={handleConfirmAssign} disabled={isSubmitting}>
              {isSubmitting ? "Đang phân công..." : "Xác nhận"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
