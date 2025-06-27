import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate, Link } from "react-router";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from "lucide-react";
import { AuthService } from "../../services/AuthService";
import { TokenUtils } from "../../utils/tokenUtils";
import { toast } from "react-toastify";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

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
          (value) => {
            if (!value) return false;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phoneRegex = /^(?:\+84|0)\d{9,10}$/;
            return emailRegex.test(value) || phoneRegex.test(value);
          }
        ),
      password: Yup.string()
        .required("Bắt buộc nhập mật khẩu")
        .min(6, "Tối thiểu 6 ký tự"),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      setApiError(null);

      try {
        const loginResult = await AuthService.login(values.email, values.password);

        if (loginResult.success && loginResult.token) {
          const role = TokenUtils.getRoleFromToken(loginResult.token);
          toast.success(`Đăng nhập thành công! Xin chào ${values.email}`, {
                  position: "top-left",
                  autoClose: 3000,
                });
          if (role === "Patient") {
            navigate("/patient/dashboard");
          } else if (role && ["Administrator", "Owner", "Receptionist", "Assistant", "Dentist"].includes(role)) {
            navigate("/dashboard");
          } else {
            navigate("/");
          }

          localStorage.setItem("token", loginResult.token);
        } else {
          setApiError("Đăng nhập thất bại. Vui lòng thử lại.");
        }
      } catch (error) {
        if (error instanceof Error) {
          setApiError(error.message);
        } else {
          setApiError("Lỗi không xác định");
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await AuthService.loginWithGoogle();
    } catch {
      setApiError("Lỗi đăng nhập Google");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <form
        onSubmit={formik.handleSubmit}
        className="w-full max-w-md space-y-6 bg-white/10 backdrop-blur border border-slate-700 shadow-xl p-6 rounded"
      >
        <h1 className="text-2xl font-bold text-white text-center">Đăng nhập</h1>

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
              className={`w-full pl-10 pr-3 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${
                formik.touched.email && formik.errors.email
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

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Mật khẩu
            </label>
            <Link type="button" className="text-sm text-blue-400 hover:underline" to={`/forgot-password`}>
              Quên mật khẩu?
            </Link>
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
              className={`w-full pl-10 pr-10 py-2 rounded-md bg-slate-700/50 text-white placeholder:text-slate-400 border focus:outline-none ${
                formik.touched.password && formik.errors.password
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-slate-600 focus:ring-1 focus:ring-blue-500"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-slate-400 hover:text-slate-300"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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

        {apiError && (
          <p className="text-center text-red-500 text-sm font-medium" role="alert">
            {apiError}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition disabled:opacity-60"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-800 px-2 text-slate-400">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-slate-800 font-medium py-2.5 px-4 rounded-md transition-colors border border-gray-300 relative"
        >
          {isGoogleLoading ? (
            <div className="absolute left-4 w-5 h-5 border-t-2 border-b-2 border-slate-800 rounded-full animate-spin"></div>
          ) : (
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              ></path>
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              ></path>
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              ></path>
            </svg>
          )}
          <span>{isGoogleLoading ? "Connecting..." : "Continue with Google"}</span>
        </button>

        <div className="text-center">
          <Link
            to="/"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Trở về trang chủ
          </Link>
        </div>
      </form>
    </div>
  );
}
