import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Phone, Mail, MoreHorizontal } from "lucide-react"
import type { Patient } from "@/types/patient"
import { Link } from "react-router"
import { formatDateWithDay } from "@/utils/dateUtils"

interface Props {
    patient: Patient
    index: number
}

export default function PatientTableRow({ patient, index }: Props) {
    const rowBg = index % 2 === 0 ? "bg-white" : "bg-gray-50"

    return (
        <tr
            className={`shadow-sm ${rowBg} hover:bg-gray-100 transition-colors duration-200`}
            style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)" }}
        >
            <td className="p-4 first:rounded-l-md">{patient.fullname}</td>
            <td className="p-4">
                <Badge
                    className={
                        patient.gender === "Male"
                            ? "bg-blue-500 text-white"
                            : "bg-pink-500 text-white"
                    }
                >
                    {patient.gender === "Male" ? "Nam" : "Nữ"}
                </Badge>
            </td>
            <td className="p-4 text-sm">{formatDateWithDay(patient.dob)}</td>
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
                <Button asChild variant="outline" size="sm">
                    <Link to={`/patient/view-treatment-records?userId=${patient.userId}&patientId=${patient.patientId}`}>
                        Xem Hồ Sơ Điều Trị
                    </Link>
                </Button>
            </td>
            <td className="p-4 last:rounded-r-md">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Tùy chọn">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link to={`/patient/${patient.userId}`}>Xem Chi Tiết</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link to={`/edit-patient/${patient.userId}`}>Chỉnh Sửa Bệnh Nhân</Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}