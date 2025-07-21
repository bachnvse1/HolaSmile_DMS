import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { Link } from "react-router"
import { useLocation, useNavigate } from "react-router"
import { toast } from "react-toastify"
import axiosInstance from "@/lib/axios"

export default function ResetPassword() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const token = location.state?.resetPasswordToken

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .required("Bắt buộc nhập mật khẩu mới")
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ in hoa")
        .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
        .matches(/\d/, "Mật khẩu phải có ít nhất 1 số")
        .matches(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
      confirmPassword: Yup.string()
        .required("Bắt buộc xác nhận mật khẩu")
        .oneOf([Yup.ref("newPassword")], "Mật khẩu xác nhận không khớp"),
    }),
    onSubmit: async (values) => {
      if (!token) {
        toast.error("Thiếu token reset mật khẩu.")
        return
      }

      try {
        await axiosInstance.post("/user/ResetPassword", {
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
          resetPasswordToken: token,
        })

        toast.success("Đặt lại mật khẩu thành công.")
        setIsSuccess(true)

        setTimeout(() => {
          navigate("/login")
        }, 3000)
      } catch (error: any) {
        if (error.response) {
          toast.error(error.response.data.message || "Đã có lỗi xảy ra.")
        } else {
          toast.error("Không thể kết nối đến máy chủ.")
        }
      }
    },
  })

  if (!token) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Liên kết không hợp lệ</h1>
              <p className="text-white/80">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <div className="pt-4">
                <Link
                  to="/forgot-password"
                  className="inline-block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Yêu cầu liên kết mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`
          }}
        />
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/15 backdrop-blur-lg border border-white/20 rounded-xl shadow-2xl">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Đổi mật khẩu thành công</h1>
              <p className="text-white/80">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <div className="pt-4 space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Đăng nhập ngay
                </Link>
                <Link to="/" className="block text-blue-300 hover:text-blue-200 transition-colors font-medium">
                  Về trang chủ
                </Link>
              </div>
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
      
      {/* Reset Password Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="relative z-10 w-full max-w-md space-y-6 bg-white/15 backdrop-blur-lg border border-white/20 shadow-2xl p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold text-white text-center mb-8">Đặt lại mật khẩu</h1>

        {formik.status && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
            <p className="text-sm text-red-200 flex items-center gap-2">
              <AlertCircle size={16} />
              {formik.status}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium text-white/90">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={18} />
            <input
              id="newPassword"
              name="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Mật khẩu mới"
              className={`w-full pl-11 pr-12 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder:text-white/60 border focus:outline-none transition-all ${formik.touched.newPassword && formik.errors.newPassword
                  ? "border-red-400 focus:ring-2 focus:ring-red-400/50"
                  : "border-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-sm text-red-300 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.newPassword}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={18} />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Xác nhận mật khẩu mới"
              className={`w-full pl-11 pr-12 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder:text-white/60 border focus:outline-none transition-all ${formik.touched.confirmPassword && formik.errors.confirmPassword
                  ? "border-red-400 focus:ring-2 focus:ring-red-400/50"
                  : "border-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white/90 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formik.touched.confirmPassword && formik.errors.confirmPassword && (
            <p className="text-sm text-red-300 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.confirmPassword}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {formik.isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Đang đổi mật khẩu...
            </div>
          ) : (
            "Đổi mật khẩu"
          )}
        </button>

        <div className="text-center pt-4">
          <Link to="/login" className="text-blue-300 hover:text-blue-200 transition-colors font-medium">
            Trở về trang đăng nhập
          </Link>
        </div>
      </form>
    </div>
  )
}