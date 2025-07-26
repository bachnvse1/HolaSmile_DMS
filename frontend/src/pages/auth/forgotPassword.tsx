import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { toast } from "react-toastify"
import axiosInstance from "@/lib/axios"
import { requestOtpSms } from "@/services/AuthService"

export function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedValue, setSubmittedValue] = useState("")
  const [serverMessage, setServerMessage] = useState("")
  const [isPhoneNumber, setIsPhoneNumber] = useState(false)
  const navigate = useNavigate()

  const validationSchema = Yup.object({
    email: Yup.string()
      .required("Bắt buộc nhập email hoặc số điện thoại")
      .test(
        "is-email-or-phone",
        "Không đúng định dạng email hoặc số điện thoại",
        function (value) {
          if (!value) return false
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          const phoneRegex = /^(?:\+84|0)\d{9,10}$/
          return emailRegex.test(value) || phoneRegex.test(value)
        }
      ),
  })

  // Helper function to check if input is phone number
  const checkIsPhoneNumber = (value: string): boolean => {
    const phoneRegex = /^(?:\+84|0)\d{9,10}$/
    return phoneRegex.test(value)
  }

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      const isPhone = checkIsPhoneNumber(values.email)
      setIsPhoneNumber(isPhone)
      
      try {
        if (isPhone) {
          // Handle phone number - use SMS OTP
          const response = await requestOtpSms({ phoneNumber: values.email })
          
          toast.success(response || "Đã gửi mật khẩu qua SMS")
          setServerMessage(response || "Đã gửi mật khẩu qua SMS")
          setSubmittedValue(values.email)
          setIsSuccess(true)
          
          // For phone number, redirect to login page after showing success
          setTimeout(() => {
            navigate("/login")
          }, 2000)
          
        } else {
          // Handle email - use existing email OTP logic
          const res = await axiosInstance.post("/user/OTP/Request", {
            email: values.email,
          })

          toast.success(res.data.message || "Gửi thành công")
          setServerMessage(res.data.message || "Gửi thành công")
          setSubmittedValue(values.email)
          setIsSuccess(true)
          
          // For email, redirect to verify-otp page
          navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`)
        }
      } catch (error: any) {
        if (error.response) {
          toast.error(error.response.data.message || error.response.data || "Đã xảy ra lỗi.")
        } else if (error.message) {
          toast.error(error.message)
        } else {
          toast.error("Không thể kết nối đến máy chủ.")
        }
      } finally {
        setIsLoading(false)
      }
    },
  })

  if (isSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center px-4">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Success Content */}
        <div className="relative z-10 w-full max-w-md bg-white/15 backdrop-blur-lg border border-white/20 shadow-2xl p-8 rounded-xl">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Đã gửi thành công</h1>
            <p className="text-white/80">
              {serverMessage} đến{" "}
              <span className="text-white font-medium">{submittedValue}</span>
            </p>
            <p className="text-sm text-white/60">
              {isPhoneNumber ? (
                "Vui lòng kiểm tra tin nhắn SMS và sử dụng mã OTP để đăng nhập."
              ) : (
                "Nếu không thấy email, hãy kiểm tra mục spam hoặc thử lại sau vài phút."
              )}
            </p>
            <div className="pt-4">
              <Link
                to="/login"
                className="text-blue-300 hover:text-blue-200 transition-colors font-medium inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Trở về trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Forgot Password Form */}
      <div className="relative z-10 w-full max-w-md space-y-6 bg-white/15 backdrop-blur-lg border border-white/20 shadow-2xl p-8 rounded-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Khôi phục mật khẩu</h1>
          <p className="text-white/80">
            Nhập email hoặc số điện thoại để nhận mật khẩu tạm thời.
          </p>
        </div>
        
        <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white/90">
              Email hoặc số điện thoại
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
              <input
                id="email"
                name="email"
                type="text"
                placeholder="Email hoặc số điện thoại"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                disabled={isLoading}
                className={`w-full pl-11 pr-3 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder:text-white/60 border focus:outline-none transition-all ${
                  formik.touched.email && formik.errors.email
                    ? "border-red-400 focus:ring-2 focus:ring-red-400/50"
                    : "border-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                }`}
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="text-sm text-red-300">{formik.errors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Đang gửi...
              </div>
            ) : (
              "Gửi"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          <Link
            to="/login"
            className="text-blue-300 hover:text-blue-200 transition-colors font-medium inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}