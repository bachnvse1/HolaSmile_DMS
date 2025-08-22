import { Button } from "@/components/ui/button2"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import type { User } from "@/types/user"
import { formatDate } from "@/utils/dateUtils"

interface UserTableRowProps {
    user: User
    index: number
    onToggleStatus: (userId: number) => void
}

export function UserTableRow({ user, index, onToggleStatus }: UserTableRowProps) {
    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "Administrator":
                return "info"
            case "Receptionist":
                return "info"
            case "Patient":
                return "outline"
            case "Dentist":
                return "info"
            case "Assistant":
                return "info"
            case "Owner":
                return "info"
            default:
                return "outline"
        }
    }

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case "Administrator":
                return "Quản trị viên"
            case "Receptionist":
                return "Lễ tân"
            case "Patient":
                return "Bệnh nhân"
            case "Dentist":
                return "Nha sĩ"
            case "Assistant":
                return "Trợ lý"
            case "Owner":
                return "Chủ sở hữu"
            default:
                return role
        }
    }

    return (
        <TableRow className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phoneNumber}</TableCell>
            <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)} className={user.role !== 'Patient' ? 'border border-gray-400' : ''}>
                    {getRoleDisplayName(user.role)}
                </Badge>
            </TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
                <Badge variant={user.status ? "default" : "destructive"}>{user.status ? "Đang hoạt động" : "Đã chặn"}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onToggleStatus(Number(user.userId))}
                    className={user.status 
                        ? "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:border-red-600" 
                        : "bg-green-500 text-white border-green-500 hover:bg-green-600 hover:border-green-600"
                    }
                >
                    {user.status ? (
                        <>
                            Chặn
                        </>
                    ) : (
                        <>
                            Bỏ chặn
                        </>
                    )}
                </Button>
            </TableCell>
        </TableRow>
    )
}