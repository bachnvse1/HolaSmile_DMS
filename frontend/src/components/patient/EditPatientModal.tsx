import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button2"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState } from "react"
import type { Patient } from "@/types/patient"
import { toast } from "react-toastify"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { parse, format } from "date-fns"
import { vi } from "date-fns/locale"

interface Props {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patientId: number, updatedData: Partial<Patient>) => Promise<void>
}

type Gender = "Male" | "Female"

// Improved validation schema with better error messages
const schema = yup.object({
  fullname: yup
    .string()
    .trim()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên không được quá 100 ký tự")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ tên chỉ được chứa chữ cái và khoảng trắng")
    .required("Họ tên không được để trống"),
  dob: yup
    .date()
    .typeError("Ngày sinh không hợp lệ")
    .max(new Date(), "Ngày sinh không được trong tương lai")
    .test('age-check', 'Tuổi phải từ 0 đến 120', function(value) {
      if (!value) return false
      const today = new Date()
      const age = today.getFullYear() - value.getFullYear()
      return age >= 0 && age <= 120
    })
    .required("Vui lòng chọn ngày sinh"),
  gender: yup.mixed<Gender>().oneOf(["Male", "Female"], "Vui lòng chọn giới tính").required("Vui lòng chọn giới tính"),
  phone: yup
    .string()
    .trim()
    .matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567)")
    .required("Số điện thoại không được để trống"),
  email: yup
    .string()
    .trim()
    .email("Email không hợp lệ")
    .max(100, "Email không được quá 100 ký tự")
    .required("Email không được để trống"),
  address: yup
    .string()
    .trim()
    .max(200, "Địa chỉ không được quá 200 ký tự")
    .optional()
    .default(""),
  underlyingConditions: yup
    .string()
    .trim()
    .max(500, "Bệnh lý nền không được quá 500 ký tự")
    .optional()
    .default(""),
})

// Infer FormData type from schema
type FormData = yup.InferType<typeof schema>

export default function EditPatientModal({ patient, open, onOpenChange, onSave }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: {
      fullname: "",
      dob: new Date(),
      gender: "Male" as Gender,
      phone: "",
      email: "",
      address: "",
      underlyingConditions: "",
    },
  })

  useEffect(() => {
    setHasUnsavedChanges(isDirty)
  }, [isDirty])

  useEffect(() => {
    if (open && patient) {
      try {
        const parsedDate = parse(patient.dob, "dd/MM/yyyy", new Date())
        reset({
          fullname: patient.fullname || "",
          dob: parsedDate,
          gender: (patient.gender as Gender) || "Male",
          phone: patient.phone || "",
          email: patient.email || "",
          address: patient.address || "",
          underlyingConditions: patient.underlyingConditions || "",
        })
      } catch (error) {
        console.error("Error parsing patient data:", error)
        toast.error("Có lỗi khi tải dữ liệu bệnh nhân")
      }
    }
  }, [open, patient, reset])

  const onSubmit = async (data: FormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const formattedData = {
        ...data,
        fullname: data.fullname.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        address: data.address?.trim() || "",
        underlyingConditions: data.underlyingConditions?.trim() || "",
        dob: format(data.dob, "dd/MM/yyyy"),
      }
      
      await onSave(patient.patientId, formattedData)
      toast.success("Cập nhật thông tin bệnh nhân thành công!")
      onOpenChange(false)
    } catch (err) {
      console.error("Error saving patient:", err)
      toast.error("Có lỗi xảy ra khi lưu. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?")) {
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?")) {
        reset()
        onOpenChange(false)
      }
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Chỉnh sửa thông tin bệnh nhân
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Điền đầy đủ các thông tin bên dưới để cập nhật hồ sơ bệnh nhân.
            <span className="text-red-500 ml-1">*</span> là các trường bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <Label className="font-medium">
                Họ tên <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("fullname")}
                placeholder="Nhập họ và tên"
                className={errors.fullname ? "border-red-500" : ""}
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.fullname.message}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="flex flex-col gap-1">
              <Label className="font-medium">
                Ngày sinh <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}
                    className={`w-full border px-3 py-2 rounded ${errors.dob ? "border-red-500" : ""}`}
                    placeholderText="Chọn ngày sinh"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    locale={vi}
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown
                  />
                )}
              />
              {errors.dob && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.dob.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div className="flex flex-col gap-1">
              <Label className="font-medium">
                Giới tính <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-6 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="Male"
                    {...register("gender")}
                    className="text-blue-600"
                  />
                  <span>Nam</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="Female"
                    {...register("gender")}
                    className="text-blue-600"
                  />
                  <span>Nữ</span>
                </label>
              </div>
              {errors.gender && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.gender.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <Label className="font-medium">
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("phone")}
                placeholder="0901234567"
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label className="font-medium">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("email")}
                type="email"
                placeholder="example@email.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label className="font-medium">Địa chỉ</Label>
              <Input
                {...register("address")}
                placeholder="Nhập địa chỉ"
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.address.message}
                </p>
              )}
            </div>

            {/* Underlying Conditions */}
            <div className="md:col-span-2 flex flex-col gap-1">
              <Label className="font-medium">Bệnh lý nền</Label>
              <Textarea
                {...register("underlyingConditions")}
                placeholder="Mô tả các bệnh lý nền (nếu có)"
                rows={3}
                className={`resize-none ${errors.underlyingConditions ? "border-red-500" : ""}`}
              />
              {errors.underlyingConditions && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span>⚠️</span>
                  {errors.underlyingConditions.message}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 text-base rounded-md"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0}
              className="px-6 py-2 text-base rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}