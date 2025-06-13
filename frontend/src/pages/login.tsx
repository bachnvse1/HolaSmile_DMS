import type React from "react"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

interface ValidationErrors {
  email?: string
  password?: string
}

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  })

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return "Email is required"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address"
    }
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return "Password is required"
    }
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase and one lowercase letter"
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number"
    }
    return undefined
  }

  const validateForm = (): boolean => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    setErrors({
      email: emailError,
      password: passwordError,
    })

    return !emailError && !passwordError
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)

    if (touched.email) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value),
      }))
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)

    if (touched.password) {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }))
    }
  }

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }))
    setErrors((prev) => ({
      ...prev,
      email: validateEmail(email),
    }))
  }

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }))
    setErrors((prev) => ({
      ...prev,
      password: validatePassword(password),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({ email: true, password: true })

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Simulate login process
      await new Promise((resolve) => setTimeout(resolve, 1500))
      console.log("Login successful:", { email, password, rememberMe })
      // Here you would typically redirect or update app state
    } catch (error) {
      console.error("Login failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm">
          <div className="p-6 pb-8">
            <h1 className="text-2xl font-semibold text-white text-center">Sign in to your account</h1>
          </div>
          <div className="p-6 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full pl-10 py-2 px-3 bg-slate-700/50 border rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.email && touched.email
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="name@clinic.com"
                    aria-invalid={errors.email && touched.email ? "true" : "false"}
                    aria-describedby={errors.email && touched.email ? "email-error" : undefined}
                  />
                  {errors.email && touched.email && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {errors.email && touched.email && (
                  <p id="email-error" className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <button type="button" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={handlePasswordBlur}
                    className={`w-full pl-10 pr-10 py-2 px-3 bg-slate-700/50 border rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.password && touched.password
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-slate-600 focus:ring-blue-500 focus:border-blue-500"
                    }`}
                    placeholder="Password"
                    aria-invalid={errors.password && touched.password ? "true" : "false"}
                    aria-describedby={errors.password && touched.password ? "password-error" : undefined}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {errors.password && touched.password && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && touched.password && (
                  <p id="password-error" className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-sm text-slate-300 cursor-pointer">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="text-center">
              <span className="text-sm text-slate-400">
                Don't have an account?{" "}
                <button className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                  Create an account
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
