import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button2"
import { UserTableRow } from "./UserTableRow"
import { UserTableSkeleton } from "./UserTableSkeleton"
import type { User } from "@/types/user"

interface UserTableProps {
    users: User[]
    onToggleStatus: (userId: number) => void
    onClearFilters: () => void
    isLoading: boolean
}

export function UserTable({ users, onToggleStatus, onClearFilters, isLoading }: UserTableProps) {
    if (isLoading) {
        return <UserTableSkeleton />
    }

    return (
        <>
            <div className="shadow-lg rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Họ và tên</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Số điện thoại</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, index) => (
                            <UserTableRow key={user.userId} user={user} index={index} onToggleStatus={onToggleStatus} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Không tìm thấy người dùng nào. Tạo người dùng đầu tiên để bắt đầu.</p>
                    <Button variant="outline" className="mt-2 bg-transparent" onClick={onClearFilters}>
                        Xóa bộ lọc
                    </Button>
                </div>
            )}
        </>
    )
}