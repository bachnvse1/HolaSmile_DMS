import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { Link } from "react-router"
import { useLocation } from "react-router"

export default function ResetPassword() {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const location = useLocation()

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
      try {
        const res = await fetch("http://localhost:5135/api/user/ResetPassword", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
            resetPasswordToken: token,
          }),
        })

        if (res.ok) {
          setIsSuccess(true)
        } else {
          const data = await res.json()
          formik.setStatus(data.message || "Đã có lỗi xảy ra.")
        }
      } catch (error) {
        console.error("Reset password error:", error)
        formik.setStatus("Không thể kết nối đến máy chủ.")
      }
    },
  })

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-white">Liên kết không hợp lệ</h1>
              <p className="text-sm text-slate-400">Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <div className="pt-4">
                <Link
                  to="/forgot-password"
                  className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-white">Đổi mật khẩu thành công</h1>
              <p className="text-sm text-slate-400">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập với mật khẩu mới.
              </p>
              <div className="pt-4 space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
                >
                  Đăng nhập ngay
                </Link>
                <Link to="/" className="block text-sm text-blue-400 hover:text-blue-300 transition-colors">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form
          onSubmit={formik.handleSubmit}
          className="space-y-6 bg-slate-800/50 backdrop-blur border border-slate-700 shadow-xl p-6 rounded-lg"
        >
          {formik.status && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <p className="text-sm text-red-400 flex items-center gap-2">
                <AlertCircle size={16} />
                {formik.status}
              </p>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-1">
            <label htmlFor="newPassword" className="block text-sm font-medium text-slate-300">
              Mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formik.values.newPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Mật khẩu mới"
                className={`w-full pl-10 pr-10 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${
                  formik.touched.newPassword && formik.errors.newPassword
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-slate-600 focus:ring-1 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formik.touched.newPassword && formik.errors.newPassword && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle size={14} /> {formik.errors.newPassword}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Xác nhận mật khẩu mới"
                className={`w-full pl-10 pr-10 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${
                  formik.touched.confirmPassword && formik.errors.confirmPassword
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-slate-600 focus:ring-1 focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formik.touched.confirmPassword && formik.errors.confirmPassword && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertCircle size={14} /> {formik.errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={formik.isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {formik.isSubmitting ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
          </button>

          {/* Back to Login */}
          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Trở về trang đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
