import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Phone, Mail, MoreHorizontal } from "lucide-react"
import type { Patient } from "@/types/patient"
import { Link } from "react-router"

interface Props {
    patient: Patient
}

export default function PatientTableRow({ patient }: Props) {
    return (
        <tr className="border-b">
            <td className="p-4">
                <div className="font-medium">{patient.fullname}</div>
            </td>
            <td className="p-4">
                <Badge variant={patient.gender === "Male" ? "default" : "secondary"}>{patient.gender === "Male" ? "Nam" : "Nữ"}</Badge>
            </td>
            <td className="p-4 text-sm">{patient.dob}</td>
            <td className="p-4">
                <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {patient.email}
                    </div>
                </div>
            </td>
            <td className="p-4">
                <Link to={`/patient/view-treatment-records?userId=${patient.userId}`}>
                    Xem Hồ Sơ Điều Trị
                </Link>
            </td>
            <td className="p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Xem Chi Tiết</DropdownMenuItem>
                        <DropdownMenuItem>Chỉnh Sửa Bệnh Nhân</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}
