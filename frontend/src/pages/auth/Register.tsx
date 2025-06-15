import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Link, useNavigate } from "react-router"

export default function Register() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const navigate = useNavigate()

    const formik = useFormik({
        initialValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            agreeToTerms: false,
        },
        validationSchema: Yup.object({
            fullName: Yup.string()
                .required("Bắt buộc nhập họ và tên")
                .min(2, "Họ và tên phải có ít nhất 2 ký tự")
                .matches(/^[a-zA-ZÀ-ỹ\s]+$/, "Họ và tên chỉ được chứa chữ cái và khoảng trắng"),
            email: Yup.string().required("Bắt buộc nhập email").email("Email không hợp lệ"),
            password: Yup.string()
                .required("Bắt buộc nhập mật khẩu")
                .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
                .matches(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ in hoa")
                .matches(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
                .matches(/\d/, "Mật khẩu phải có ít nhất 1 số")
                .matches(/[!@#$%^&*(),.?":{}|<>]/, "Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),
            confirmPassword: Yup.string()
                .required("Bắt buộc xác nhận mật khẩu")
                .oneOf([Yup.ref("password")], "Mật khẩu xác nhận không khớp"),
            agreeToTerms: Yup.boolean().oneOf([true], "Bạn phải đồng ý với điều khoản dịch vụ"),
        }),
        onSubmit: async (values) => {
            try {
                await new Promise((r) => setTimeout(r, 2000)) // Simulate API call

                // Simulate successful registration
                alert(`Đăng ký thành công! Chào mừng ${values.fullName}`)

                // Redirect to OTP verification with email
                navigate(`/verify-otp?email=${encodeURIComponent(values.email)}`);
            } catch (error) {
                console.error("Registration error:", error)
                formik.setStatus("Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại.")
            }
        },
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-lg text-slate-400">Tạo tài khoản của bạn</h2>
                </div>

                <form
                    onSubmit={formik.handleSubmit}
                    className="space-y-6 bg-slate-800/50 backdrop-blur border border-slate-700 shadow-xl p-6 rounded-lg"
                >
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-white">Đăng ký</h1>
                        <p className="text-sm text-slate-400">Nhập thông tin của bạn để tạo tài khoản</p>
                    </div>

                    {formik.status && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                            <p className="text-sm text-red-400 flex items-center gap-2">
                                <AlertCircle size={16} />
                                {formik.status}
                            </p>
                        </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1">
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-300">
                            Họ và tên
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                value={formik.values.fullName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="Nguyễn Văn A"
                                className={`w-full pl-10 pr-3 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${formik.touched.fullName && formik.errors.fullName
                                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                                        : "border-slate-600 focus:ring-1 focus:ring-blue-500"
                                    }`}
                            />
                            {formik.touched.fullName && formik.errors.fullName && (
                                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                            )}
                        </div>
                        {formik.touched.fullName && formik.errors.fullName && (
                            <p className="text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle size={14} /> {formik.errors.fullName}
                            </p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                placeholder="name@example.com"
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
                        <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                            Mật khẩu
                        </label>
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
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle size={14} /> {formik.errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                            Xác nhận mật khẩu
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
                                placeholder="Xác nhận mật khẩu"
                                className={`w-full pl-10 pr-10 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${formik.touched.confirmPassword && formik.errors.confirmPassword
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

                    {/* Terms Agreement */}
                    <div className="space-y-1">
                        <div className="flex items-start gap-3">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                checked={formik.values.agreeToTerms}
                                onChange={formik.handleChange}
                                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-700/50 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                            />
                            <label htmlFor="agreeToTerms" className="text-sm text-slate-300">
                                Tôi đồng ý với{" "}
                                <Link to="/terms" className="text-blue-400 hover:underline">
                                    Điều khoản dịch vụ
                                </Link>{" "}
                                và{" "}
                                <Link to="/privacy" className="text-blue-400 hover:underline">
                                    Chính sách bảo mật
                                </Link>
                            </label>
                        </div>
                        {formik.touched.agreeToTerms && formik.errors.agreeToTerms && (
                            <p className="text-sm text-red-400 flex items-center gap-1">
                                <AlertCircle size={14} /> {formik.errors.agreeToTerms}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={formik.isSubmitting || !formik.values.agreeToTerms}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {formik.isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                    </button>

                    {/* Sign In Link */}
                    <div className="text-center text-slate-400 text-sm">
                        Đã có tài khoản?{" "}
                        <Link to="/login" className="text-blue-400 hover:underline font-medium">
                            Đăng nhập
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
