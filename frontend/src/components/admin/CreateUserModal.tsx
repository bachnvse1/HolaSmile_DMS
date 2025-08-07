import type React from "react"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { CreateUserForm } from "@/types/user"
import { userService } from "@/services/userService"
import { toast } from "react-toastify"
import { useState } from "react"

interface CreateUserModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    form: CreateUserForm
    onFormChange: (form: CreateUserForm) => void
    onRefreshUsers: () => void
}

interface ValidationErrors {
    fullName?: string
    email?: string
    phoneNumber?: string
    role?: string
}

export function CreateUserModal({ isOpen, onOpenChange, form, onFormChange, onRefreshUsers }: CreateUserModalProps) {
    const [errors, setErrors] = useState<ValidationErrors>({})

    const updateForm = (field: keyof CreateUserForm, value: string | boolean) => {
        onFormChange({ ...form, [field]: value })
        // Xóa lỗi khi người dùng bắt đầu nhập
        if (errors[field as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {}

        if (!form.fullName.trim()) {
            newErrors.fullName = "Họ và tên không được để trống"
        }

        if (!form.email.trim()) {
            newErrors.email = "Email không được để trống"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Email không hợp lệ"
        }

        if (!form.phoneNumber.trim()) {
            newErrors.phoneNumber = "Số điện thoại không được để trống"
        } else if (!/^[0-9]{10,11}$/.test(form.phoneNumber)) {
            newErrors.phoneNumber = "Số điện thoại phải có 10-11 chữ số"
        }

        if (!form.role.trim()) {
            newErrors.role = "Vui lòng chọn vai trò"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            toast.error("Vui lòng kiểm tra lại thông tin nhập vào")
            return
        }

        try {
            await userService.create(form)
            toast.success("Tạo người dùng thành công")
            onOpenChange(false)
            onRefreshUsers()
            // Reset form và errors
            onFormChange({
                fullName: "",
                gender: true,
                email: "",
                phoneNumber: "",
                role: "",
            })
            setErrors({})
        } catch (error: any) {
            const message = error?.response?.data?.message || "Không thể tạo người dùng"
            toast.error(message)
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
        setErrors({})
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo người dùng
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md [&~div]:backdrop-blur-none">
                <DialogHeader>
                    <DialogTitle>Tạo người dùng mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Họ và tên</Label>
                        <Input
                            id="fullName"
                            value={form.fullName}
                            onChange={(e) => updateForm("fullName", e.target.value)}
                            placeholder="Nhập họ và tên"
                            className={errors.fullName ? "border-red-500" : ""}
                        />
                        {errors.fullName && (
                            <p className="text-sm text-red-500">{errors.fullName}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select value={form.gender.toString()} onValueChange={(value) => updateForm("gender", value === "true")}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn giới tính" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="true">Nam</SelectItem>
                                <SelectItem value="false">Nữ</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateForm("email", e.target.value)}
                            placeholder="Nhập địa chỉ email"
                            className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Số điện thoại</Label>
                        <Input
                            id="phoneNumber"
                            value={form.phoneNumber}
                            onChange={(e) => updateForm("phoneNumber", e.target.value)}
                            placeholder="Nhập số điện thoại"
                            className={errors.phoneNumber ? "border-red-500" : ""}
                        />
                        {errors.phoneNumber && (
                            <p className="text-sm text-red-500">{errors.phoneNumber}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Vai trò</Label>
                        <Select value={form.role} onValueChange={(value) => updateForm("role", value)}>
                            <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                                <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Administrator">Quản trị viên</SelectItem>
                                <SelectItem value="Receptionist">Lễ tân</SelectItem>
                                <SelectItem value="Dentist">Bác sĩ nha khoa</SelectItem>
                                <SelectItem value="Assistant">Trợ lý</SelectItem>
                                <SelectItem value="Owner">Chủ sở hữu</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-red-500">{errors.role}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Hủy
                        </Button>
                        <Button type="submit">Tạo người dùng</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}