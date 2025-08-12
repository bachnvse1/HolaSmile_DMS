import { useState, useEffect, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Camera, User, Mail, Phone, MapPin, Calendar, Users, ArrowLeft, Edit3, Save, X, Eye, EyeOff, Lock, Shield, Check, AlertCircle } from "lucide-react"
import { Link, useNavigate } from "react-router"
import axiosInstance from "@/lib/axios"
import { toast } from "react-toastify"
import { TokenUtils } from "@/utils/tokenUtils"
import { Skeleton } from "@/components/ui/skeleton"
import { ConfirmModal } from "@/components/ui/ConfirmModal"
import "react-toastify/dist/ReactToastify.css"
import { Input } from "@/components/ui/input"
import type { UseFormSetValue } from "react-hook-form"
import { AuthService, type PasswordForm } from "@/services/AuthService"

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

interface OTPModalState {
  isOpen: boolean
  email: string
  formData: FormValues | null
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024
const DEFAULT_AVATAR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzgiIHI9IjE4IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4MEM0MCA3MCA2MCA3MCA4MCA4MFY5MEgyMFY4MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+"

const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (password: string) => password.length >= 8 },
  { id: 'uppercase', label: 'Ít nhất 1 chữ hoa (A-Z)', test: (password: string) => /[A-Z]/.test(password) },
  { id: 'lowercase', label: 'Ít nhất 1 chữ thường (a-z)', test: (password: string) => /[a-z]/.test(password) },
  { id: 'number', label: 'Ít nhất 1 chữ số (0-9)', test: (password: string) => /\d/.test(password) },
  { id: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#$%^&*)', test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
]

const validatePassword = (password: string): string | boolean => {
  if (!password) return "Vui lòng nhập mật khẩu mới"

  const failedRules = PASSWORD_REQUIREMENTS.filter(rule => !rule.test(password))
  if (failedRules.length > 0) {
    return "Mật khẩu không đáp ứng yêu cầu bảo mật"
  }

  return true
}

const parseDob = (dobStr: string): string => {
  if (!dobStr || !dobStr.includes("/")) return "";

  const [day, month, year] = dobStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

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

const getUserProfile = async (): Promise<FormValues> => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken")
  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập")
  }

  try {
    const response = await axiosInstance.get("/user/profile", {
      headers: { "ngrok-skip-browser-warning": "true", Authorization: `Bearer ${token}` },
    })

    return transformApiResponse(response.data)
  } catch (error: any) {
    const message = error.response?.data?.message || error.message || "Lỗi không xác định"
    throw new Error(message)
  }
}

const updateUserProfile = async (
  formData: FormValues,
  token: string,
  avatarFile: File | null = null,
  changeEmailToken?: string
): Promise<void> => {
  const formDataToSend = new FormData();

  formDataToSend.append('fullname', formData.fullname.trim());
  formDataToSend.append('email', formData.email.trim());
  formDataToSend.append('gender', formData.gender === "Nam" ? "true" : "false");
  formDataToSend.append('address', formData.address.trim());
  formDataToSend.append('dob', formData.dob);

  if (avatarFile) {
    formDataToSend.append('avatar', avatarFile);
  }

  // QUAN TRỌNG: gửi token xác nhận đổi email sau khi verify OTP
  if (changeEmailToken) {
    formDataToSend.append('changeEmailToken', changeEmailToken);
  }

  await axiosInstance.put("/user/profile", formDataToSend, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    },
  });
};

const requestEmailOTP = async (newEmail: string): Promise<void> => {
  await axiosInstance.post("/user/email-otp/request", { newEmail }, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json"
    }
  })
}

const verifyEmailOTP = async (newEmail: string, otp: string): Promise<string> => {
  const res = await axiosInstance.post("/user/email-otp/verify", {
    newEmail,
    otp: otp.trim(),
  }, {
    headers: {
      "ngrok-skip-browser-warning": "true",
      "Content-Type": "application/json"
    }
  })
  return res.data?.changeEmailToken as string
}

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

const useImageUpload = (setValue: UseFormSetValue<FormValues>) => {
  const [imageError, setImageError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    setValue("avatar", url, { shouldDirty: true })

    return () => URL.revokeObjectURL(url)
  }, [setValue])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setImageError(null)
  }, [previewUrl])

  return {
    handleImageUpload,
    imageError,
    selectedFile,
    previewUrl,
    clearSelectedFile
  }
}

const OTPModal = ({
  isOpen,
  email,
  onClose,
  onVerify
}: {
  isOpen: boolean
  email: string
  onClose: () => void
  onVerify: (otp: string) => void
}) => {
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setOtp('')
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendOTP = async () => {
    if (countdown > 0) return

    setIsLoading(true)
    try {
      await requestEmailOTP(email)
      toast.success('Mã OTP đã được gửi lại!')
      setCountdown(60)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi lại OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length === 6 && !isLoading) {
      setIsLoading(true)
      try {
        await onVerify(otp)
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xác thực email mới
            </h3>
            <p className="text-sm text-gray-600">
              Mã OTP đã được gửi đến email:
              <br />
              <span className="font-medium text-gray-900">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="000000"
                maxLength={6}
                autoComplete="off"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-center mb-6">
              {countdown > 0 ? (
                <span className="text-sm text-gray-500">
                  Gửi lại OTP sau {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-800 underline disabled:text-gray-400"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi lại OTP'}
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={otp.length !== 6 || isLoading}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

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

const PasswordRequirements = ({ password }: { password: string }) => {
  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-blue-600" />
        <span className="text-sm font-medium text-gray-700">Yêu cầu mật khẩu:</span>
      </div>
      <div className="space-y-2">
        {PASSWORD_REQUIREMENTS.map((requirement) => {
          const isValid = requirement.test(password)
          return (
            <div key={requirement.id} className="flex items-center gap-2 text-sm">
              {isValid ? (
                <Check size={14} className="text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" />
              )}
              <span className={isValid ? "text-green-700" : "text-gray-600"}>
                {requirement.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const PasswordInput = ({
  label,
  name,
  register,
  errors,
  showRequirements = false,
  watchPassword = "",
  placeholder = ""
}: {
  label: string
  name: keyof PasswordForm
  register: any
  errors: any
  showRequirements?: boolean
  watchPassword?: string
  placeholder?: string
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 block">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...register(name, {
            required: `Vui lòng nhập ${label.toLowerCase()}`,
            ...(name === "newPassword" && { validate: validatePassword }),
            ...(name === "confirmPassword" && {
              validate: (value: string, formValues: PasswordForm) =>
                value === formValues.newPassword || "Mật khẩu xác nhận không khớp"
            })
          })}
          className={`w-full pl-10 pr-12 py-3 rounded-lg border transition-all duration-200 ${errors[name]
              ? "border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            } focus:outline-none`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {errors[name] && (
        <div className="flex items-center gap-2 text-red-500 text-sm">
          <AlertCircle size={14} />
          <span>{errors[name].message}</span>
        </div>
      )}

      {showRequirements && (
        <PasswordRequirements password={watchPassword} />
      )}
    </div>
  )
}

export default function ViewProfile() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [showEmailConfirm, setShowEmailConfirm] = useState(false)
  const [otpModal, setOtpModal] = useState<OTPModalState>({
    isOpen: false,
    email: '',
    formData: null
  })
  const [originalEmail, setOriginalEmail] = useState('')

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

  const rawAvatar = watch("avatar")
  const currentEmail = watch("email")

  const displayAvatar = useMemo(() => {
    if (!rawAvatar || rawAvatar.trim() === "") return DEFAULT_AVATAR;
    return rawAvatar;
  }, [rawAvatar]);

  const {
    handleImageUpload,
    imageError,
    selectedFile,
    clearSelectedFile
  } = useImageUpload(setValue)

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 1000 * 60 * 5,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: isValidToken,
  })

  useEffect(() => {
    if (data) {
      reset(data)
      setOriginalEmail(data.email)
    }
  }, [data, reset])

  const handleEmailChangeRequest = async (formData: FormValues) => {
    try {
      await requestEmailOTP(formData.email)

      setOtpModal({
        isOpen: true,
        email: formData.email,
        formData: formData
      })

      toast.success('Mã OTP đã được gửi đến email mới!')
      setShowEmailConfirm(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi OTP')
    }
  }

  const handleOtpVerify = async (otp: string) => {
    if (!otpModal.formData) return

    try {
      // Lấy token xác nhận từ BE
      const changeEmailToken = await verifyEmailOTP(otpModal.email, otp)

      // Gọi update và gửi kèm token
      await updateUserProfile(otpModal.formData, token, selectedFile, changeEmailToken)

      queryClient.setQueryData(["user-profile"], otpModal.formData)

      toast.success("Email đã được xác thực và thông tin cá nhân đã được cập nhật thành công!")

      setOtpModal({ isOpen: false, email: '', formData: null })
      setIsEditing(false)
      clearSelectedFile()
      setOriginalEmail(otpModal.formData.email)

    } catch (error: any) {
      const message = error.response?.data?.message || error.message || "Mã OTP không chính xác hoặc đã hết hạn"
      toast.error(message)
      throw error
    }
  }

  const onSubmit = async (formData: FormValues) => {
    const avatarChanged = selectedFile !== null;
    const emailChanged = formData.email !== originalEmail;

    if (!isDirty && !avatarChanged) {
      toast.info("Không có thay đổi nào để lưu");
      return;
    }

    if (emailChanged) {
      setShowEmailConfirm(true)
      setOtpModal(prev => ({ ...prev, formData }))
      return
    }

    try {
      setIsSubmitting(true)

      await updateUserProfile(formData, token, selectedFile)

      queryClient.setQueryData(["user-profile"], formData)

      toast.success("Cập nhật thành công!")
      setIsEditing(false)
      clearSelectedFile()
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Lỗi không xác định."
      toast.error(`${message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    watch: watchPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting }
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  })

  const newPassword = watchPassword("newPassword")

  const onChangePassword = async (data: PasswordForm) => {
    try {
      await AuthService.changePassword(
        data.currentPassword,
        data.newPassword,
        data.confirmPassword
      )
      toast.success("Đổi mật khẩu thành công!")
      resetPasswordForm()
      setShowPasswordForm(false)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error.message || "Lỗi đổi mật khẩu")
    }
  }

  const handleCancel = useCallback(() => {
    if (data) {
      reset(data)
    }
    clearSelectedFile()
    setIsEditing(false)
    setShowEmailConfirm(false)
    setOtpModal({ isOpen: false, email: '', formData: null })
  }, [data, reset, clearSelectedFile])

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
            className={`w-full px-4 py-3 rounded-lg border transition-colors ${icon ? "pl-10" : ""
              } ${errors[name] ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
              } ${isDisabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"
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
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border hover:bg-gray-100 transition-colors"
            aria-label="Quay lại"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Thông tin cá nhân</h1>
            <p className="text-sm text-gray-600">Quản lý và cập nhật thông tin cá nhân</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              {renderInput("Email", "email", "email", <Mail size={16} />)}
              {renderInput("Số điện thoại", "phone", "tel", <Phone size={16} />, true)}
              {renderInput("Địa chỉ", "address", "text", <MapPin size={16} />)}
              {renderInput("Ngày sinh", "dob", "date", <Calendar size={16} />)}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Giới tính <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    disabled={!isEditing}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 appearance-none focus:outline-none focus:ring-2 transition-colors ${errors.gender ? "border-red-400 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
                      } ${!isEditing ? "bg-gray-50 cursor-not-allowed" : "bg-white"
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
                  disabled={isSubmitting || (!isDirty && !selectedFile)}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Ảnh đại diện</h3>
            <div className="relative w-48 h-64 mx-auto mb-6">
              <img
                src={displayAvatar}
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl border-4 border-gray-100 shadow-sm"
                onError={(e) => {
                  if (e.currentTarget.src !== DEFAULT_AVATAR) {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }
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
                {selectedFile && (
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    ✓ Đã chọn: {selectedFile.name}
                  </div>
                )}
              </div>
            )}

            {imageError && (
              <p className="text-red-500 text-sm mt-2">
                {imageError}
              </p>
            )}
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Bảo mật tài khoản</h2>
                  <p className="text-sm text-gray-600">Thay đổi mật khẩu để bảo vệ tài khoản</p>
                </div>
              </div>
              {!showPasswordForm && (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Lock size={16} />
                  Đổi mật khẩu
                </button>
              )}
            </div>
          </div>

          {showPasswordForm && (
            <div className="p-6">
              <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-6">
                <PasswordInput
                  label="Mật khẩu hiện tại"
                  name="currentPassword"
                  register={registerPassword}
                  errors={passwordErrors}
                  placeholder="Nhập mật khẩu hiện tại"
                />

                <PasswordInput
                  label="Mật khẩu mới"
                  name="newPassword"
                  register={registerPassword}
                  errors={passwordErrors}
                  showRequirements={true}
                  watchPassword={newPassword}
                  placeholder="Nhập mật khẩu mới"
                />

                <PasswordInput
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  register={registerPassword}
                  errors={passwordErrors}
                  placeholder="Nhập lại mật khẩu mới"
                />

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false)
                      resetPasswordForm()
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isPasswordSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        Cập nhật mật khẩu
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <ConfirmModal
          isOpen={showEmailConfirm}
          onClose={() => {
            setShowEmailConfirm(false)
            setOtpModal({ isOpen: false, email: '', formData: null })
          }}
          onConfirm={() => {
            if (otpModal.formData) {
              handleEmailChangeRequest(otpModal.formData)
            }
          }}
          title="Xác nhận thay đổi email"
          message={`Bạn có muốn thay đổi email từ "${originalEmail}" thành "${currentEmail}" không? 

Chúng tôi sẽ gửi mã OTP đến email mới để xác thực trước khi cập nhật thông tin.`}
          confirmText="Gửi OTP"
          isLoading={false}
        />

        <OTPModal
          isOpen={otpModal.isOpen}
          email={otpModal.email}
          onClose={() => setOtpModal({ isOpen: false, email: '', formData: null })}
          onVerify={handleOtpVerify}
        />
      </div>
    </div>
  )
}
