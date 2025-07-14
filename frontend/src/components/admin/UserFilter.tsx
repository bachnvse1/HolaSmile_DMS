import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button2"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/types/user"

interface UserFiltersProps {
    allUsers: User[]
    onUsersFiltered: (filtered: User[]) => void
}

export function UserFilters({ allUsers, onUsersFiltered }: UserFiltersProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [filteredCount, setFilteredCount] = useState(allUsers.length)

    useEffect(() => {
        const filtered = allUsers.filter((user) => {
            const matchesSearch =
                user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phoneNumber.includes(searchTerm)

            const matchesRole = roleFilter === "all" || user.role === roleFilter
            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && user.status) ||
                (statusFilter === "banned" && !user.status)

            return matchesSearch && matchesRole && matchesStatus
        })

        setFilteredCount(filtered.length)
        onUsersFiltered(filtered)
    }, [searchTerm, roleFilter, statusFilter, allUsers, onUsersFiltered])

    const handleClearFilters = () => {
        setSearchTerm("")
        setRoleFilter("all")
        setStatusFilter("all")
    }

    return (
        <div className="bg-gray-100 p-4 rounded-lg space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <Label htmlFor="search">Tìm kiếm người dùng</Label>
                    <Input
                        id="search"
                        placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                    />
                </div>

                <div className="sm:w-48">
                    <Label htmlFor="roleFilter">Lọc theo vai trò</Label>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả vai trò</SelectItem>
                            <SelectItem value="Administrator">Quản trị viên</SelectItem>
                            <SelectItem value="Receptionist">Lễ tân</SelectItem>
                            <SelectItem value="Patient">Bệnh nhân</SelectItem>
                            <SelectItem value="Dentist">Bác sĩ nha khoa</SelectItem>
                            <SelectItem value="Assistant">Trợ lý</SelectItem>
                            <SelectItem value="Owner">Chủ sở hữu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="sm:w-48">
                    <Label htmlFor="statusFilter">Lọc theo trạng thái</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="active">Đang hoạt động</SelectItem>
                            <SelectItem value="banned">Đã cấm</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Hiển thị {filteredCount} trong tổng số {allUsers.length} người dùng
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                        Xóa bộ lọc
                    </Button>
                </div>
            </div>
        </div>
    )
}