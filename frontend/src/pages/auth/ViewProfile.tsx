import type React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useQuery } from "@tanstack/react-query"
import { Camera, User, Mail, Phone, MapPin, Calendar, Users, ArrowLeft } from "lucide-react"
import { Link } from "react-router"
import { TokenUtils } from "../../utils/tokenUtils"
import { useNavigate } from "react-router"

type FormValues = {
  userID: string
  username: string
  fullname: string
  email: string
  avatar: string
  phone: string
  address: string
  dob: string
  gender: "Nam" | "Nữ"
}

const getUserProfile = async (id: string): Promise<FormValues> => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken')
  
  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập")
  }
  
  const res = await fetch(`http://localhost:5135/api/user/profile/${id}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`, 
      "Content-Type": "application/json"
    },
    credentials: "include",
  });
  
  if (!res.ok) {
    throw new Error(`Lỗi API: ${res.status} - ${res.statusText}`)
  }
  
  return res.json()
}

export default function ViewProfile() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  
  // Check authentication
  const isAuthenticated = TokenUtils.isAuthenticated()
  const userData = TokenUtils.getUserData()
  const token = localStorage.getItem('token') || localStorage.getItem('authToken')
  
  // If not authenticated, show login prompt
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Chưa đăng nhập</h2>
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem trang này.</p>

          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  // Get user ID from token
  let userID: string;
  try {
    const decodedToken = TokenUtils.decodeToken(token);
    userID = decodedToken?.userId || '';
    
    if (!userID) {
      throw new Error("Không tìm thấy user ID trong token");
    }
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Lỗi Token</h2>
          <p className="text-gray-600 mb-4">Token không hợp lệ hoặc đã hết hạn.</p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    );
  }

  const role = userData.role || 'Unknown'
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>()

  const avatar = watch("avatar")

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-profile", userID],
    queryFn: () => getUserProfile(userID),
    staleTime: 1000 * 60 * 5,
    enabled: !!userID, // Only run if userID exists
  })

  useEffect(() => {
    if (data) {
      reset(data)
    }
  }, [data, reset])

  const onSubmit = (formData: FormValues) => {
    console.log("Dữ liệu cập nhật:", formData)
    reset(formData)
    setIsEditing(false)
    alert("Cập nhật thành công!")
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setValue("avatar", url)
    }
  }

  const renderInput = (label: string, name: keyof FormValues, type = "text", icon?: React.ReactNode, disabledField = false) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-700 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          type={type}
          {...register(name, {
            required: "Trường này là bắt buộc",
            ...(name === "email" && {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Email không hợp lệ",
              },
            }),
            ...(name === "phone" && {
              pattern: {
                value: /^(?:\+84|0)\d{9,10}$/,
                message: "Số điện thoại không hợp lệ",
              },
            }),
          })}
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${icon ? "pl-10" : ""
            } ${errors[name] ? "border-red-300" : "border-gray-300"} ${!isEditing || disabledField ? "bg-gray-50 cursor-not-allowed" : "bg-white"
            }`}
          disabled={!isEditing || disabledField}
        />
      </div>
      {errors[name] && <p className="text-red-500 text-sm">{errors[name]?.message}</p>}
    </div>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Đang tải hồ sơ...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <User className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Lỗi tải hồ sơ</h2>
          <p className="text-red-500 mb-4">{error instanceof Error ? error.message : 'Lỗi không xác định'}</p>
                   
          <Link 
            to="/login" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập lại
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
              <p className="text-sm text-gray-500">Quản lý thông tin cá nhân của bạn</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM THÔNG TIN */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
                <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin cá nhân của bạn</p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-green-600 border border-green-600 px-4 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-colors text-sm font-medium"
                >
                  Chỉnh sửa
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderInput("Mã người dùng", "userID", "text", <User size={16} />, true)}
              {renderInput("Tên đăng nhập", "username", "text", <User size={16} />, true)}
              {renderInput("Họ và tên", "fullname", "text", <User size={16} />)}
              {renderInput("Email", "email", "email", <Mail size={16} />)}
              {renderInput("Số điện thoại", "phone", "tel", <Phone size={16} />)}
              {renderInput("Địa chỉ", "address", "text", <MapPin size={16} />)}
              {renderInput("Ngày sinh", "dob", "date", <Calendar size={16} />)}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 block">Giới tính</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select
                    {...register("gender", { required: "Vui lòng chọn giới tính" })}
                    disabled={!isEditing}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none ${errors.gender ? "border-red-300" : "border-gray-300"
                      } ${!isEditing ? "bg-gray-50 cursor-not-allowed" : "bg-white"}`}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message}</p>}
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    reset(data!)
                    setIsEditing(false)
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Lưu thay đổi
                </button>
              </div>
            )}
          </div>

          {/* AVATAR */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Ảnh đại diện</h3>
              <div className="relative w-48 h-64 mx-auto mb-6">
                <img
                  src={avatar || "/placeholder.svg"}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-xl border-4 border-gray-100"
                />
                {isEditing && (
                  <>
                    <label
                      htmlFor="avatarInput"
                      className="absolute bottom-3 right-3 bg-green-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-green-700 transition-colors"
                    >
                      <Camera size={16} />
                    </label>
                    <input
                      type="file"
                      id="avatarInput"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </>
                )}
              </div>
              {isEditing && (
                <p className="text-sm text-gray-500">Nhấp vào biểu tượng camera để thay đổi ảnh đại diện</p>
              )}
            </div>

            {/* User Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Trạng thái</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Hoạt động
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Vai trò</span>
                  <span className="text-sm font-medium text-gray-900">{role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tên đăng nhập</span>
                  <span className="text-sm font-medium text-gray-900">{userData.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">User ID</span>
                  <span className="text-sm font-medium text-gray-900">{userID}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}