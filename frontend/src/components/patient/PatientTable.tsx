import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import type { Patient } from "@/types/patient"
import PatientTableRow from "./PatientTableRow"

interface Props {
    patients: Patient[]
}

export default function PatientTable({ patients }: Props) {
    const isEmpty = patients.length === 0

    return (
        <Card className="space-y-4">
            <div className="px-4 pt-4">
                <h2 className="text-xl font-semibold">Bệnh Nhân ({patients.length})</h2>
            </div>

            {isEmpty ? (
                <div className="text-center py-8 text-muted-foreground">
                    Không tìm thấy bệnh nhân nào phù hợp với tiêu chí của bạn.
                </div>
            ) : (
                <div className="overflow-x-auto space-y-3">
                    <Table className="min-w-full border-separate border-spacing-y-3">
                        <TableHeader>
                            <TableRow className="border bg-muted/40 rounded-md">
                                <TableHead className="p-4">Bệnh Nhân</TableHead>
                                <TableHead className="p-4">Giới Tính</TableHead>
                                <TableHead className="p-4">Ngày Sinh</TableHead>
                                <TableHead className="p-4">Liên Hệ</TableHead>
                                <TableHead className="p-4">Hồ Sơ Điều Trị</TableHead>
                                <TableHead className="p-4 w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.map((patient, index) => (
                                <PatientTableRow key={patient.userId} patient={patient} index={index} />
                            ))}
                        </TableBody>

                    </Table>
                </div>
            )}
        </Card>
    )
}
