import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { Camera, User, Mail, Phone, MapPin, Calendar, Users, ArrowLeft } from "lucide-react"
import { Link, useNavigate } from "react-router"
import axiosInstance from "@/lib/axios"
import { toast } from "react-toastify"
import { TokenUtils } from "@/utils/tokenUtils"
import { getDateString } from "@/utils/date"
import { Skeleton } from "@/components/ui/skeleton"
import "react-toastify/dist/ReactToastify.css"

type FormValues = {
  username: string
  fullname: string
  email: string
  avatar: string
  phone: string
  address: string
  dob: string
  gender: "Nam" | "Nữ"
}

const parseDob = (dobStr: string): string => {
  if (!dobStr.includes("/")) return ""
  const [day, month, year] = dobStr.split("/")
  const date = new Date(+year, +month - 1, +day)
  return isNaN(date.getTime()) ? "" : getDateString(date)
}

const getUserProfile = async (): Promise<FormValues> => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken")
  if (!token) throw new Error("Không tìm thấy token đăng nhập")

  const response = await axiosInstance.get(`/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = response.data
  return {
    username: data.username,
    fullname: data.fullname,
    email: data.email,
    avatar: data.avatar,
    phone: data.phone,
    address: data.address,
    dob: data.dob ? parseDob(data.dob) : "",
    gender: data.gender === true ? "Nam" : "Nữ",
  }
}

export default function ViewProfile() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isValidToken, setIsValidToken] = useState(true)

  const token = localStorage.getItem("token") ?? localStorage.getItem("authToken") ?? ""

  useEffect(() => {
    try {
      const decoded = TokenUtils.decodeToken(token)
      if (!decoded?.userId) throw new Error()
    } catch {
      setIsValidToken(false)
    }
  }, [token])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>()

  const avatar = watch("avatar")

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5,
    enabled: isValidToken,
  })

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const onSubmit = async (formData: FormValues) => {
    const payload = {
      fullname: formData.fullname,
      gender: formData.gender === "Nam",
      address: formData.address,
      dob: formData.dob,
      avatar: formData.avatar,
    }

    try {
      setIsSubmitting(true)
      await axiosInstance.put("/user/profile", payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      toast.success("✅ Cập nhật thành công!")
      setIsEditing(false)
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Lỗi không xác định."
      toast.error(`❌ ${msg}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setValue("avatar", url)

      // Clean up after render
      return () => URL.revokeObjectURL(url)
    }
  }

  const renderInput = (
    label: string,
    name: keyof FormValues,
    type = "text",
    icon?: React.ReactNode,
    disabledField = false
  ) => {
    const isDob = name === "dob"
    const maxDate = new Date().toISOString().split("T")[0]

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">{label}</label>
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
          <input
            type={type}
            max={isDob ? maxDate : undefined}
            {...register(name, {
              required: "Trường này là bắt buộc",
              ...(name === "email" && {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Email không hợp lệ",
                },
              }),
              ...(name === "phone" && {
                pattern: {
                  value: /^(?:\+84|0)\d{9,10}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              }),
            })}
            disabled={disabledField || !isEditing}
            className={`w-full px-4 py-3 rounded border ${icon ? "pl-10" : ""} ${errors[name] ? "border-red-400" : "border-gray-300"
              } ${!isEditing || disabledField ? "bg-gray-100" : "bg-white"} focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
        </div>
        {errors[name] && <p className="text-red-500 text-sm">{errors[name]?.message}</p>}
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-red-600">Token không hợp lệ hoặc đã hết hạn</h1>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Đăng nhập lại</Link>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-20">
        ❌ Lỗi tải hồ sơ: {(error as Error)?.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded border hover:bg-gray-100">
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
            <p className="text-sm text-gray-500">Quản lý thông tin cá nhân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow p-8 border">
            <div className="flex justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Thông tin</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-green-600 border border-green-600 px-4 py-2 rounded hover:bg-green-600 hover:text-white"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput("Tên đăng nhập", "username", "text", <User size={16} />, true)}
              {renderInput("Họ và tên", "fullname", "text", <User size={16} />)}
              {renderInput("Email", "email", "email", <Mail size={16} />, true)}
              {renderInput("Số điện thoại", "phone", "tel", <Phone size={16} />, true)}
              {renderInput("Địa chỉ", "address", "text", <MapPin size={16} />)}
              {renderInput("Ngày sinh", "dob", "date", <Calendar size={16} />)}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Giới tính</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    disabled={!isEditing}
                    className={`w-full border rounded pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.gender ? "border-red-400" : "border-gray-300"
                      } ${!isEditing ? "bg-gray-100" : "bg-white"}`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    reset(data!)
                    setIsEditing(false)
                  }}
                  className="px-6 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-8 border text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ảnh đại diện</h3>
            <div className="relative w-48 h-64 mx-auto mb-6">
              <img
                src={avatar || "/placeholder.svg"}
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl border-4 border-gray-100"
              />
              {isEditing && (
                <>
                  <label
                    htmlFor="avatarInput"
                    className="absolute bottom-3 right-3 bg-green-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition-colors"
                  >
                    <Camera size={16} />
                  </label>
                  <input
                    type="file"
                    id="avatarInput"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </>
              )}
            </div>
            {isEditing && <p className="text-sm text-gray-500">Nhấp vào biểu tượng camera để thay đổi ảnh</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
