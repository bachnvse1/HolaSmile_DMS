import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import { Ban, UserCheck } from "lucide-react"
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
                return "default"
            case "Receptionist":
                return "secondary"
            case "Patient":
                return "outline"
            case "Dentist":
                return "destructive"
            case "Assistant":
                return "info"
            case "Owner":
                return "success"
            default:
                return "outline"
        }
    }

    return (
        <TableRow className={`border-b border-gray-300 ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phoneNumber}</TableCell>
            <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role)} className={user.role === 'Receptionist' ? 'border border-gray-400' : ''}>
                    {user.role}
                </Badge>
            </TableCell>
            <TableCell>{formatDate(user.createdAt)}</TableCell>
            <TableCell>
                <Badge variant={user.status ? "default" : "destructive" }>{user.status ? "Active" : "Banned"}</Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button variant={user.status ? "default" : "destructive"} size="sm" onClick={() => onToggleStatus(Number(user.userId))}>
                    {user.status ? (
                        <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Ban
                        </>
                    ) : (
                        <>
                            <Ban className="w-4 h-4 mr-1" />
                            Unban
                        </>
                    )}
                </Button>
            </TableCell>
        </TableRow>
    )
}
