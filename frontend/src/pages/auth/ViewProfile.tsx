import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, User, Mail, Phone, MapPin, Calendar, Users, ArrowLeft, Edit3, Save, X } from "lucide-react"
import { Link, useNavigate } from "react-router"
import axiosInstance from "@/lib/axios"
import { toast } from "react-toastify"
import { TokenUtils } from "@/utils/tokenUtils"
import { getDateString } from "@/utils/date"
import { Skeleton } from "@/components/ui/skeleton"
import "react-toastify/dist/ReactToastify.css"
import { Input } from "@/components/ui/input"

// Types
type Gender = "Nam" | "Nữ"

interface FormValues {
  username: string
  fullname: string
  email: string
  avatar: string
  phone: string
  address: string
  dob: string
  gender: Gender
}

interface ApiResponse {
  username: string
  fullname: string
  email: string
  avatar: string
  phone: string
  address: string
  dob: string
  gender: boolean
}

// Constants
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Utilities
const parseDob = (dobStr: string): string => {
  if (!dobStr || !dobStr.includes("/")) return ""
  
  const [day, month, year] = dobStr.split("/")
  const date = new Date(+year, +month - 1, +day)
  
  return isNaN(date.getTime()) ? "" : getDateString(date)
}

const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)"
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return "Kích thước file không được vượt quá 5MB"
  }
  
  return null
}

const transformApiResponse = (data: ApiResponse): FormValues => ({
  username: data.username || "",
  fullname: data.fullname || "",
  email: data.email || "",
  avatar: data.avatar || "",
  phone: data.phone || "",
  address: data.address || "",
  dob: data.dob ? parseDob(data.dob) : "",
  gender: data.gender === true ? "Nam" : "Nữ",
})

// API Functions
const getUserProfile = async (): Promise<FormValues> => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken")
  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập")
  }

  try {
    const response = await axiosInstance.get("/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })

    return transformApiResponse(response.data)
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || "Lỗi không xác định"
    throw new Error(message)
  }
}

const updateUserProfile = async (formData: FormValues, token: string): Promise<void> => {
  const payload = {
    fullname: formData.fullname.trim(),
    gender: formData.gender === "Nam",
    address: formData.address.trim(),
    dob: formData.dob,
    avatar: formData.avatar,
  }

  await axiosInstance.put("/user/profile", payload, {
    headers: { Authorization: `Bearer ${token}` },
  })
}

// Custom Hooks
const useTokenValidation = () => {
  const [isValidToken, setIsValidToken] = useState(true)
  const token = localStorage.getItem("token") ?? localStorage.getItem("authToken") ?? ""

  useEffect(() => {
    if (!token) {
      setIsValidToken(false)
      return
    }

    try {
      const decoded = TokenUtils.decodeToken(token)
      if (!decoded?.userId) {
        throw new Error("Invalid token structure")
      }
    } catch {
      setIsValidToken(false)
    }
  }, [token])

  return { isValidToken, token }
}

const useImageUpload = (setValue: (name: keyof FormValues, value: string) => void) => {
  const [imageError, setImageError] = useState<string | null>(null)

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)
    
    const validationError = validateImageFile(file)
    if (validationError) {
      setImageError(validationError)
      toast.error(validationError)
      return
    }

    const url = URL.createObjectURL(file)
    setValue("avatar", url)

    // Cleanup function
    return () => URL.revokeObjectURL(url)
  }, [setValue])

  return { handleImageUpload, imageError }
}

// Components
const LoadingState = () => (
  <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-4">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
)

const ErrorState = ({ message }: { message: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h1 className="text-xl font-bold text-red-600">Có lỗi xảy ra</h1>
      <p className="text-gray-600">{message}</p>
      <Link 
        to="/login" 
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Đăng nhập lại
      </Link>
    </div>
  </div>
)

const TokenInvalidState = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center space-y-4 p-8 bg-white rounded-xl shadow">
      <div className="text-red-500 text-4xl mb-4">🔒</div>
      <h1 className="text-xl font-bold text-red-600">Token không hợp lệ hoặc đã hết hạn</h1>
      <p className="text-gray-600">Vui lòng đăng nhập lại để tiếp tục</p>
      <Link 
        to="/login" 
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Đăng nhập lại
      </Link>
    </div>
  </div>
)

// Main Component
export default function ViewProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { isValidToken, token } = useTokenValidation()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      username: "",
      fullname: "",
      email: "",
      avatar: "",
      phone: "",
      address: "",
      dob: "",
      gender: "Nam",
    }
  })

  const avatar = watch("avatar")
  const { handleImageUpload, imageError } = useImageUpload(setValue)

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isValidToken,
  })

  useEffect(() => {
    if (data) {
      reset(data)
    }
  }, [data, reset])

  const onSubmit = async (formData: FormValues) => {
    if (!isDirty) {
      toast.info("Không có thay đổi nào để lưu")
      return
    }

    try {
      setIsSubmitting(true)
      await updateUserProfile(formData, token)
      
      // Update cache
      queryClient.setQueryData(["user-profile"], formData)
      
      toast.success("✅ Cập nhật thành công!")
      setIsEditing(false)
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Lỗi không xác định."
      toast.error(`❌ ${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = useCallback(() => {
    if (data) {
      reset(data)
    }
    setIsEditing(false)
  }, [data, reset])

  const handleEdit = useCallback(() => {
    setIsEditing(true)
  }, [])

  const renderInput = (
    label: string,
    name: keyof FormValues,
    type = "text",
    icon?: React.ReactNode,
    disabled = false
  ) => {
    const isDob = name === "dob"
    const maxDate = new Date().toISOString().split("T")[0]
    const isDisabled = disabled || !isEditing

    const validationRules = {
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
      ...(name === "fullname" && {
        minLength: {
          value: 2,
          message: "Tên phải có ít nhất 2 ký tự",
        },
        maxLength: {
          value: 50,
          message: "Tên không được quá 50 ký tự",
        },
      }),
    }

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 block">
          {label}
          {validationRules.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            max={isDob ? maxDate : undefined}
            {...register(name, validationRules)}
            disabled={isDisabled}
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${
              icon ? "pl-10" : ""
            } ${
              errors[name] ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
            } ${
              isDisabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"
            } focus:outline-none focus:ring-2`}
          />
        </div>
        {errors[name] && (
          <p className="text-red-500 text-sm flex items-center gap-1">
            <span className="text-xs">⚠️</span>
            {errors[name]?.message}
          </p>
        )}
      </div>
    )
  }

  // Early returns for loading and error states
  if (!isValidToken) {
    return <TokenInvalidState />
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message={(error as Error)?.message || "Lỗi không xác định"} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-lg border hover:bg-gray-100 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hồ sơ cá nhân</h1>
            <p className="text-sm text-gray-600">Quản lý và cập nhật thông tin cá nhân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Section */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Thông tin cá nhân</h2>
              {!isEditing && (
                <button
                  type="button"
                  onClick={handleEdit}
                  className="flex items-center gap-2 text-sm text-green-600 border border-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
                >
                  <Edit3 size={16} />
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

              {/* Gender Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Giới tính <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    disabled={!isEditing}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 transition-colors ${
                      errors.gender ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                    } ${
                      !isEditing ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                    }`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                {errors.gender && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <span className="text-xs">⚠️</span>
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X size={16} />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>

          {/* Avatar Section */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ảnh đại diện</h3>
            <div className="relative w-48 h-64 mx-auto mb-6">
              <img
                src={avatar || "/placeholder.svg"}
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl border-4 border-gray-100 shadow-sm"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                }}
              />
              {isEditing && (
                <>
                  <label
                    htmlFor="avatarInput"
                    className="absolute bottom-3 right-3 bg-green-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition-colors"
                    title="Thay đổi ảnh đại diện"
                  >
                    <Camera size={16} />
                  </label>
                  <Input
                    type="file"
                    id="avatarInput"
                    accept={ACCEPTED_IMAGE_TYPES.join(",")}
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </>
              )}
            </div>
            
            {isEditing && (
              <div className="text-sm text-gray-500 space-y-2">
                <p>Nhấp vào biểu tượng camera để thay đổi ảnh</p>
                <p className="text-xs">
                  Hỗ trợ: JPEG, PNG, WebP (tối đa 5MB)
                </p>
              </div>
            )}
            
            {imageError && (
              <p className="text-red-500 text-sm mt-2">
                {imageError}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}