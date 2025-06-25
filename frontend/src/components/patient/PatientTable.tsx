import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import type { Patient } from "@/types/patient"
import PatientTableRow from "./PatientTableRow"

interface Props {
    patients: Patient[]
}

export default function PatientTable({ patients }: Props) {
    return (
        <Card className="space-y-4">
            <h2 className="text-xl font-semibold">
                Bệnh Nhân ({patients.length})
            </h2>
            {patients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy bệnh nhân nào phù hợp với tiêu chí của bạn.
                </div>
            ) : (
                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Bệnh Nhân</TableHead>
                                <TableHead>Giới Tính</TableHead>
                                <TableHead>Ngày Sinh</TableHead>
                                <TableHead>Liên Hệ</TableHead>
                                <TableHead>Hồ Sơ Điều Trị</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.map((patient, index) => (
                                <PatientTableRow key={index} patient={patient} />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </Card>
    )
}
