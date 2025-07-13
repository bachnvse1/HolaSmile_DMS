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
import { useEffect } from "react"
import type { Patient } from "@/types/patient"
import { toast } from "react-toastify"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { parse, format } from "date-fns"

interface Props {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (patientId: number, updatedData: Partial<Patient>) => Promise<void>
}

type Gender = "Male" | "Female"

const schema = yup.object({
  fullname: yup.string().required("Họ tên không được để trống"),
  dob: yup
    .date()
    .typeError("Ngày sinh không hợp lệ")
    .max(new Date(), "Ngày sinh không được trong tương lai")
    .required("Vui lòng chọn ngày sinh"),
  gender: yup.mixed<Gender>().oneOf(["Male", "Female"]).required(),
  phone: yup
    .string()
    .matches(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, "Số điện thoại không hợp lệ")
    .required(),
  email: yup.string().email("Email không hợp lệ").required("Email không được để trống"),
  address: yup.string().notRequired(),
  underlyingConditions: yup.string().notRequired(),
})

export default function EditPatientModal({ patient, open, onOpenChange, onSave }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "onTouched",
    defaultValues: {
      fullname: "",
      dob: undefined,
      gender: "Male" as Gender,
      phone: "",
      email: "",
      address: "",
      underlyingConditions: "",
    },
  })

  useEffect(() => {
    if (open && patient) {
      reset({
        fullname: patient.fullname,
        dob: parse(patient.dob, "dd/MM/yyyy", new Date()),
        gender: patient.gender as Gender,
        phone: patient.phone,
        email: patient.email ?? "",
        address: patient.address ?? "",
        underlyingConditions: patient.underlyingConditions ?? "",
      })
    }
  }, [open, patient, reset])

  const onSubmit = async (data: any) => {
    try {
      const formattedData = {
        ...data,
        dob: format(data.dob, "dd/MM/yyyy"),
      }
      await onSave(patient.patientId, formattedData)
      onOpenChange(false)
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu. Vui lòng thử lại.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin bệnh nhân</DialogTitle>
          <DialogDescription>
            Điền đầy đủ các thông tin bên dưới để cập nhật hồ sơ bệnh nhân.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label>Họ tên</Label>
              <Input {...register("fullname")} />
              {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Ngày sinh</Label>
              <Controller
                name="dob"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    selected={field.value}
                    onChange={field.onChange}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}
                    className="w-full border px-3 py-2 rounded"
                    placeholderText="dd/MM/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                )}
              />
              {errors.dob && <p className="text-red-500 text-sm">{errors.dob.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Giới tính</Label>
              <div className="flex items-center gap-6 mt-1">
                <label className="flex items-center gap-2">
                  <input type="radio" value="Male" {...register("gender")} />
                  Nam
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="Female" {...register("gender")} />
                  Nữ
                </label>
              </div>
              {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <Label>Số điện thoại</Label>
              <Input {...register("phone")} />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <Label>Email</Label>
              <Input {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <Label>Địa chỉ</Label>
              <Input {...register("address")} />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <Label>Bệnh lý nền</Label>
              <Input {...register("underlyingConditions")} />
            </div>
          </div>

          <div className="text-right pt-4">
            <Button type="submit" className="px-6 py-2 text-base rounded-md">
              Lưu
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
