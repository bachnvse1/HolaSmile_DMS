import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, X } from "lucide-react"
import { format, isBefore, startOfToday } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { createTreatmentProgress } from "@/services/treatmentProgressService"

const statusOptions = ["Đang tiến hành", "Tạm dừng", "Đã huỷ", "Đã hoàn thành", "Chưa bắt đầu"]

const schema = yup.object({
    progressName: yup.string().required("Tên tiến trình không được bỏ trống"),
    progressContent: yup.string().required("Nội dung không được bỏ trống"),
    status: yup.string().required("Trạng thái không được bỏ trống"),
    duration: yup
        .number()
        .typeError("Thời gian phải là số")
        .positive("Thời gian phải > 0")
        .required("Thời gian không được bỏ trống"),
    description: yup.string().required("Mô tả không được bỏ trống"),
})

type FormData = yup.InferType<typeof schema>

type Props = {
    treatmentRecordID: number
    patientID: number
    dentistID: number
    onClose: () => void
    onCreated: (data: any) => void
}

export default function NewTreatmentProgress({
    treatmentRecordID,
    patientID,
    dentistID,
    onClose,
}: Props) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>()
    const [selectedTime, setSelectedTime] = useState<string>("")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        resolver: yupResolver(schema),
    })

    const status = watch("status")

    const onSubmit = async (data: FormData) => {
        if (!selectedDate || !selectedTime) {
            toast.error("Vui lòng chọn ngày và giờ kết thúc")
            return
        }

        const [hour, minute] = selectedTime.split(":").map(Number)
        const combinedDate = new Date(selectedDate)
        combinedDate.setHours(hour)
        combinedDate.setMinutes(minute)

        const newTreatmentProgress = {
            treatmentRecordID,
            patientID,
            dentistID,
            ...data,
            endTime: combinedDate.toISOString(),
            note: "",
        }

        try {
            const result = await createTreatmentProgress(newTreatmentProgress)
            toast.success(result.message || "Tạo tiến trình thành công")
            setTimeout(() => {
                window.location.reload()
            }, 1000) 

        } catch (err) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Lỗi khi tạo tiến trình")
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Thông Tin Tiến Trình</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <Label>Tên tiến trình *</Label>
                            <Input {...register("progressName")} />
                            <p className="text-red-500 text-sm">{errors.progressName?.message}</p>
                        </div>

                        <div>
                            <Label>Nội dung *</Label>
                            <Textarea rows={3} {...register("progressContent")} />
                            <p className="text-red-500 text-sm">{errors.progressContent?.message}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Trạng thái *</Label>
                                <Select value={status} onValueChange={(val) => setValue("status", val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn trạng thái" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {s}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-red-500 text-sm">{errors.status?.message}</p>
                            </div>

                            <div>
                                <Label>Thời gian (phút) *</Label>
                                <Input type="number" {...register("duration")} />
                                <p className="text-red-500 text-sm">{errors.duration?.message}</p>
                            </div>
                        </div>

                        <div>
                            <Label>Mô tả *</Label>
                            <Textarea rows={3} {...register("description")} />
                            <p className="text-red-500 text-sm">{errors.description?.message}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Ngày kết thúc *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {selectedDate
                                                ? format(selectedDate, "dd/MM/yyyy")
                                                : "Chọn ngày"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={(date) => {
                                                if (date && !isBefore(date, startOfToday())) {
                                                    setSelectedDate(date)
                                                } else {
                                                    toast.warning("Không được chọn ngày trong quá khứ")
                                                }
                                            }}
                                            disabled={(date) => isBefore(date, startOfToday())}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div>
                                <Label>Giờ kết thúc *</Label>
                                <Input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSubmitting ? "Đang lưu..." : "Lưu"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                <X className="h-4 w-4 mr-2" /> Hủy
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
