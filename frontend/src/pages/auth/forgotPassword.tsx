import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { Link } from "react-router"

export function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submittedValue, setSubmittedValue] = useState("")

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

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        await new Promise((res) => setTimeout(res, 2000)) // giả lập gọi API
        setSubmittedValue(values.email)
        setIsSuccess(true)
      } catch (err) {
        console.error("Lỗi gửi reset:", err)
      } finally {
        setIsLoading(false)
      }
    },
  })

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-lg text-slate-400">Quên mật khẩu?</h2>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <h1 className="text-xl font-semibold text-white">Đã gửi thành công</h1>
              <p className="text-sm text-slate-400">
                Chúng tôi đã gửi thông tin khôi phục đến{" "}
                <span className="text-white font-medium">{submittedValue}</span>
              </p>
              <p className="text-xs text-slate-500">
                Nếu không thấy email, hãy kiểm tra mục spam hoặc thử lại sau vài phút.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Trở về trang đăng nhập
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
        <div className="text-center mb-8">
          <h2 className="text-lg text-slate-400">Quên mật khẩu</h2>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="p-6 pb-8">
            <h1 className="text-2xl font-semibold text-white text-center">Khôi phục mật khẩu</h1>
            <p className="text-sm text-slate-400 text-center mt-2">
              Nhập email hoặc số điện thoại để nhận mật khẩu tạm thời.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <form onSubmit={formik.handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email hoặc số điện thoại
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="Email hoặc số điện thoại"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={isLoading}
                    className={`w-full pl-10 py-2 px-3 bg-slate-700/50 border rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      formik.touched.email && formik.errors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-slate-600 focus:ring-blue-500"
                    }`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-sm text-red-400">{formik.errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Đang gửi..." : "Gửi"}
              </button>
            </form>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Trở về trang đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
