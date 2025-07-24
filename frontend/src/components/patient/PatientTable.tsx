import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import type { Patient } from "@/types/patient"
import PatientTableRow from "./PatientTableRow"
import EditPatientModal from "./EditPatientModal"
import { useState } from "react"
import { updatePatient } from "@/services/patientService"
import { toast } from "react-toastify"
import { useUserInfo } from "@/hooks/useUserInfo"

interface Props {
    patients: Patient[]
    refetchPatients: () => void
}

export default function PatientTable({ patients, refetchPatients }: Props) {
    const isEmpty = patients.length === 0
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const userInfo = useUserInfo()

    // Check if user role should hide treatment records
    const shouldHideTreatmentRecords = userInfo?.role === "Administrator" || userInfo?.role === "Owner"

    const handleEditPatient = (patient: Patient) => {
        setSelectedPatient(patient)
        setEditModalOpen(true)
    }

    const handleSave = async (patientId: number, updatedData: any) => {
        try {
            const response = await updatePatient(patientId, updatedData)
            toast.success(response.message || "Cập nhật thành công!")
            refetchPatients()
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại."
            toast.error(errorMessage)
        }
    }

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
                                {!shouldHideTreatmentRecords && (
                                    <TableHead className="p-4">Hồ Sơ Điều Trị</TableHead>
                                )}
                                <TableHead className="p-4 w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {patients.map((patient, index) => (
                                <PatientTableRow
                                    key={patient.userId}
                                    patient={patient}
                                    index={index}
                                    onEdit={handleEditPatient}
                                    shouldHideTreatmentRecords={shouldHideTreatmentRecords}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {selectedPatient && (
                <EditPatientModal
                    patient={selectedPatient}
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    onSave={handleSave}
                />
            )}
        </Card>
    )
}