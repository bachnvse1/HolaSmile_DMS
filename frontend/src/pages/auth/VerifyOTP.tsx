import React, { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useSearchParams, Link, useNavigate } from "react-router"
import axios from "axios"

type OTPInputProps = {
  value: string
  index: number
  onChange: (index: number, value: string) => void
  onKeyDown: (index: number, e: React.KeyboardEvent) => void
  inputRef: (el: HTMLInputElement | null) => void
  disabled: boolean
  hasError: boolean
}

function OTPInput({
  value,
  index,
  onChange,
  onKeyDown,
  inputRef,
  disabled,
  hasError,
}: OTPInputProps) {
  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(index, e.target.value)}
      onKeyDown={(e) => onKeyDown(index, e)}
      disabled={disabled}
      className={`w-12 h-12 text-center text-lg font-semibold bg-slate-700/50 border rounded-md text-white focus:outline-none focus:ring-2 transition-colors ${hasError ? "border-red-500 focus:ring-red-500" : "border-slate-600 focus:ring-blue-500"
        }`}
    />
  )
}

export default function VerifyOTP() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email") || "user@example.com"
  const navigate = useNavigate()

  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Quản lý đếm ngược gửi lại OTP
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, canResend])

  const formik = useFormik({
    initialValues: {
      otp: ["", "", "", "", "", ""],
    },
    validationSchema: Yup.object({
      otp: Yup.array()
        .of(Yup.string().matches(/^\d$/, "Chỉ được nhập số"))
        .test("all-filled", "Vui lòng nhập đầy đủ mã OTP", (value) => {
          return value?.every((digit) => digit !== "")
        }),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const otpCode = values.otp.join("").toString()
        const expiryTime = new Date().toISOString()

        const res = await axios.post(
          "https://localhost:5001/api/user/OTP/Verify",
          {
            email,
            otp: otpCode,
            expiryTime,
          },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )

        if (res.status === 200 ) {
          setIsSuccess(true)

          setTimeout(() => {
            navigate("/reset-password", {
              state: {
                resetPasswordToken: res.data,
              },
            })
          }, 1500)
        } else {
          formik.setFieldError("otp", "Xác thực thất bại. Vui lòng thử lại.")
        }
      } catch (err: any) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          formik.setFieldError("otp", err.response.data.message)
        } else {
          formik.setFieldError("otp", "Có lỗi xảy ra. Vui lòng thử lại.")
        }
      } finally {
        setIsLoading(false)
      }
    }
  })

  // Xử lý nhập từng ô OTP
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...formik.values.otp]
    newOtp[index] = value
    formik.setFieldValue("otp", newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Xử lý phím backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (formik.values.otp[index]) {
        // Nếu ô hiện tại có giá trị thì xóa giá trị đó
        const newOtp = [...formik.values.otp]
        newOtp[index] = ""
        formik.setFieldValue("otp", newOtp)
      } else if (index > 0) {
        // Nếu ô hiện tại rỗng thì focus ô trước đó
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  // Xử lý dán OTP (paste)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""))
    formik.setFieldValue("otp", newOtp)
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  // Gửi lại mã OTP
  const handleResendOTP = async () => {
    setIsResending(true)
    try {
      await axios.post(
        "https://localhost:5001/api/user/OTP/Request",
        { email },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setCanResend(false)
      setCountdown(60)
      formik.resetForm()
      inputRefs.current[0]?.focus()
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        alert(err.response.data.message)
      } else {
        alert("Không thể gửi lại mã OTP. Vui lòng thử lại sau.")
      }
    } finally {
      setIsResending(false)
    }
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
              <h1 className="text-xl font-semibold text-white">Xác thực thành công</h1>
              <p className="text-sm text-slate-400">Mã OTP đã được xác thực thành công. Đang chuyển hướng...</p>
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
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="p-6 pb-8">
            <h1 className="text-2xl font-semibold text-white text-center">Xác thực OTP</h1>
            <p className="text-sm text-slate-400 text-center mt-2">Mã xác thực 6 số đã được gửi đến</p>
            <p className="text-sm text-white font-medium text-center mt-1">{email}</p>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={formik.handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300 text-center">Nhập mã OTP</label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {formik.values.otp.map((digit, index) => (
                    <OTPInput
                      key={index}
                      value={digit}
                      index={index}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      inputRef={(el) => (inputRefs.current[index] = el)}
                      disabled={isLoading}
                      hasError={!!formik.errors.otp}
                    />
                  ))}
                </div>
                {typeof formik.errors.otp === "string" && (
                  <p className="text-sm text-red-400 text-center flex items-center justify-center gap-1 mt-1">
                    <AlertCircle size={14} /> {formik.errors.otp}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || formik.values.otp.some((digit) => !digit)}
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors ${isLoading || formik.values.otp.some((digit) => !digit) ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {isLoading ? "Đang xác thực..." : "Xác thực"}
              </button>
            </form>

            {/* Nút gửi lại mã OTP */}
            <div className="mt-4 text-center">
              {canResend ? (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium disabled:opacity-70"
                >
                  <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
                  {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
                </button>
              ) : (
                <p className="text-sm text-slate-500">Gửi lại sau {countdown} giây</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
