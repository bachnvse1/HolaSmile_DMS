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

interface CreateUserModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    form: CreateUserForm
    onFormChange: (form: CreateUserForm) => void
    onRefreshUsers: () => void
}

export function CreateUserModal({ isOpen, onOpenChange, form, onFormChange, onRefreshUsers }: CreateUserModalProps) {
    const updateForm = (field: keyof CreateUserForm, value: string | boolean) => {
        onFormChange({ ...form, [field]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await userService.create(form)
            toast.success("Tạo người dùng thành công")
            onOpenChange(false)
            onRefreshUsers()
        } catch (error: any) {
            const message = error?.response?.data?.message || "Không thể tạo người dùng"
            toast.error(message)
        }
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
                            required
                        />
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
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Số điện thoại</Label>
                        <Input
                            id="phoneNumber"
                            value={form.phoneNumber}
                            onChange={(e) => updateForm("phoneNumber", e.target.value)}
                            placeholder="Nhập số điện thoại"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Vai trò</Label>
                        <Select value={form.role} onValueChange={(value) => updateForm("role", value)}>
                            <SelectTrigger>
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
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit">Tạo người dùng</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}