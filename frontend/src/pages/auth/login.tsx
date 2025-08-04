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
          const fullName = TokenUtils.getFullNameFromToken(loginResult.token);
          toast.success(`Đăng nhập thành công! Xin chào ${fullName}`, {
            position: "top-right",
            autoClose: 3000,
          });
          if (role === "Patient") {
            navigate("/patient/appointments");
          } else if (role && ["Administrator", "Receptionist", "Assistant", "Dentist"].includes(role)) {
            navigate("/appointments");
          } else if (role === "Owner") {
            navigate("/dashboard");
          }
          else {
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
      
      {/* Login Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="relative z-10 w-full max-w-md space-y-6 bg-white/15 backdrop-blur-lg border border-white/20 shadow-2xl p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold text-white text-center mb-8">Đăng nhập</h1>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-white/90">
            Tên đăng nhập
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={18} />
            <input
              id="email"
              name="email"
              type="text"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Tên đăng nhập"
              className={`w-full pl-11 pr-3 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder:text-white/60 border focus:outline-none transition-all ${formik.touched.email && formik.errors.email
                  ? "border-red-400 focus:ring-2 focus:ring-red-400/50"
                  : "border-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                }`}
            />
            {formik.touched.email && formik.errors.email && (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" size={18} />
            )}
          </div>
          {formik.touched.email && formik.errors.email && (
            <p className="text-sm text-red-300 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="password" className="text-sm font-medium text-white/90">
              Mật khẩu
            </label>
            <Link type="button" className="text-sm text-blue-300 hover:text-blue-200 transition-colors" to={`/forgot-password`}>
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={18} />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Mật khẩu"
              className={`w-full pl-11 pr-12 py-3 rounded-lg bg-white/10 backdrop-blur text-white placeholder:text-white/60 border focus:outline-none transition-all ${formik.touched.password && formik.errors.password
                  ? "border-red-400 focus:ring-2 focus:ring-red-400/50"
                  : "border-white/30 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2 items-center">
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-white/70 hover:text-white/90 transition-colors"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {formik.touched.password && formik.errors.password && (
            <p className="text-sm text-red-300 flex items-center gap-1">
              <AlertCircle size={14} /> {formik.errors.password}
            </p>
          )}
        </div>

        {apiError && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
            <p className="text-center text-red-200 text-sm font-medium" role="alert">
              {apiError}
            </p>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
              Đang đăng nhập...
            </div>
          ) : (
            "Đăng nhập"
          )}
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/30"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-transparent px-3 text-white/70 font-medium">hoặc</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white/90 hover:bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl relative disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <div className="absolute left-4 w-5 h-5 border-t-2 border-b-2 border-gray-800 rounded-full animate-spin"></div>
          ) : (
            <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
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
          <span>{isGoogleLoading ? "Đang kết nối..." : "Tiếp tục với Google"}</span>
        </button>

        <div className="text-center pt-4">
          <Link
            to="/"
            className="text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về trang chủ
          </Link>
        </div>
      </form>
    </div>
  );
}