import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react"
import { Link } from "react-router"

export function Login() {
  const [showPassword, setShowPassword] = useState(false)

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .required("Bắt buộc nhập email hoặc số điện thoại")
        .test(
          "is-email-or-phone",
          "Phải là email hợp lệ hoặc số điện thoại hợp lệ",
          function (value) {
            if (!value) return false
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const phoneRegex = /^(?:\+84|0)\d{9,10}$/
            return emailRegex.test(value) || phoneRegex.test(value)
          }
        ),
      password: Yup.string()
        .required("Bắt buộc nhập mật khẩu")
        .min(8, "Tối thiểu 8 ký tự")
        .matches(/[A-Z]/, "Ít nhất 1 chữ in hoa")
        .matches(/[a-z]/, "Ít nhất 1 chữ thường")
        .matches(/\d/, "Ít nhất 1 số"),
    }),
    onSubmit: async (values) => {
      await new Promise((r) => setTimeout(r, 1500))
      alert(`Đăng nhập thành công với: ${values.email}`)
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <form
        onSubmit={formik.handleSubmit}
        className="w-full max-w-md space-y-6 bg-white/10 backdrop-blur border border-slate-700 shadow-xl p-6 rounded"
      >
        <h1 className="text-2xl font-bold text-white text-center">Đăng nhập</h1>

        {/* Email or Phone */}
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-slate-300">
            Email hoặc số điện thoại
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              id="email"
              name="email"
              type="text"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Email hoặc số điện thoại"
              className={`w-full pl-10 pr-3 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${formik.touched.email && formik.errors.email
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-slate-600 focus:ring-1 focus:ring-blue-500"
                }`}
            />
            {formik.touched.email && formik.errors.email && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />
            )}
          </div>
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">Mật khẩu</label>
            <Link type="button" className="text-sm text-blue-400 hover:underline" to={`/forgot-password`}>Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Mật khẩu"
              className={`w-full pl-10 pr-10 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${formik.touched.password && formik.errors.password
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-slate-600 focus:ring-1 focus:ring-blue-500"
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-300"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.password}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition disabled:opacity-60"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="text-center text-slate-400 text-sm">
          Chưa có tài khoản?{" "}
          <button className="text-blue-400 hover:underline">Đăng ký</button>
        </div>
        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Trở về trang trang chủ
          </Link>
        </div>

      </form>
    </div>
  )
}
