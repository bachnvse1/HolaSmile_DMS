import React, { useState, useRef, useEffect } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { useSearchParams, Link, useNavigate } from "react-router"
import { toast } from "react-toastify"
import axiosInstance from "@/lib/axios"
import { Input } from "@/components/ui/input"

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
    <Input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value}
      onChange={(e) => onChange(index, e.target.value)}
      onKeyDown={(e) => onKeyDown(index, e)}
      disabled={disabled}
      className={`w-12 h-12 text-center text-lg font-semibold bg-white/10 backdrop-blur border rounded-lg text-white focus:outline-none focus:ring-2 transition-all ${
        hasError 
          ? "border-red-400 focus:ring-red-400/50" 
          : "border-white/30 focus:ring-blue-400/50 focus:border-blue-400"
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
        .test("all-filled", "Vui lòng nhập đầy đủ mã OTP", (value) =>
          value?.every((digit) => digit !== "")
        ),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const otpCode = values.otp.join("")
        const expiryTime = new Date().toISOString()

        const res = await axiosInstance.post("/user/OTP/Verify", {
          email,
          otp: otpCode,
          expiryTime,
        })

        setIsSuccess(true)

        setTimeout(() => {
          navigate("/reset-password", {
            state: {
              resetPasswordToken: res.data,
            },
          })
        }, 1500)
      } catch (err: any) {
        if (err.response?.data?.message) {
          formik.setFieldError("otp", err.response.data.message)
        } else {
          formik.setFieldError("otp", "Có lỗi xảy ra. Vui lòng thử lại.")
        }
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleInputChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const newOtp = [...formik.values.otp]
    newOtp[index] = value
    formik.setFieldValue("otp", newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (formik.values.otp[index]) {
        const newOtp = [...formik.values.otp]
        newOtp[index] = ""
        formik.setFieldValue("otp", newOtp)
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""))
    formik.setFieldValue("otp", newOtp)
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    try {
      await axiosInstance.post("/user/OTP/Request", { email })

      setCanResend(false)
      setCountdown(60)
      formik.resetForm()
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message)
      } else {
        toast.error("Không thể gửi lại mã OTP. Vui lòng thử lại sau.")
      }
    } finally {
      setIsResending(false)
    }
  }

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
            <h1 className="text-2xl font-semibold text-white">Xác thực thành công</h1>
            <p className="text-white/80">Mã OTP đã được xác thực thành công. Đang chuyển hướng...</p>
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
      
      {/* Verify OTP Form */}
      <div className="relative z-10 w-full max-w-md space-y-6 bg-white/15 backdrop-blur-lg border border-white/20 shadow-2xl p-8 rounded-xl">
        <div className="text-center mb-8">
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Xác thực OTP</h1>
          <p className="text-white/80 mb-1">Mã xác thực 6 số đã được gửi đến</p>
          <p className="text-white font-medium">{email}</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-white/90 text-center">Nhập mã OTP</label>
            <div className="flex gap-3 justify-center" onPaste={handlePaste}>
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
              <p className="text-sm text-red-300 text-center flex items-center justify-center gap-1">
                <AlertCircle size={14} /> {formik.errors.otp}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || formik.values.otp.some((digit) => !digit)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                Đang xác thực...
              </div>
            ) : (
              "Xác thực"
            )}
          </button>
        </form>

        <div className="text-center pt-4">
          {canResend ? (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="inline-flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200 transition-colors font-medium disabled:opacity-70"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
              {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
            </button>
          ) : (
            <p className="text-sm text-white/60">Gửi lại sau {countdown} giây</p>
          )}
        </div>
      </div>
    </div>
  )
}