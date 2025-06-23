import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { Plus, FileText } from "lucide-react"

import FilterBar from "@/components/patientTreatment/FilterBar"
import SummaryStats from "@/components/patientTreatment/SummaryStats"
import TreatmentTable from "@/components/patientTreatment/TreatmentTable"
import TreatmentModal from "@/components/patientTreatment/TreatmentModal"

import type { FilterFormData, TreatmentFormData, TreatmentRecord } from "@/types/treatment"
import { getTreatmentRecordsByUser } from "@/services/treatmentService"
import { Navigation } from "@/layouts/homepage/Navigation"

const PatientTreatmentRecords: React.FC = () => {
    const {
        register,
        watch,
    } = useForm<FilterFormData>({
        defaultValues: {
            searchTerm: "",
            filterStatus: "all",
            filterDentist: "all",
        },
    })

    const treatmentForm = useForm<TreatmentFormData>()
    const { reset: resetTreatmentForm } = treatmentForm

    const [records, setRecords] = useState<TreatmentRecord[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingRecord, setEditingRecord] = useState<TreatmentRecord | null>(null)

    const searchTerm = watch("searchTerm")
    const filterStatus = watch("filterStatus")
    const filterDentist = watch("filterDentist")

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await getTreatmentRecordsByUser(6)
                setRecords(data)
            } catch (error) {
                console.error("Error fetching treatment records:", error)
            }
        }

        fetchRecords()
    }, [])

    const filteredRecords = records.filter((record) => {
        const matchesSearch =
            record.toothPosition.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.treatmentRecordID.toString().includes(searchTerm) ||
            (record.dentistName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

        const matchesStatus =
            filterStatus === "all" || record.treatmentStatus.toLowerCase() === filterStatus.toLowerCase()

        const matchesDentist =
            filterDentist === "all" || record.dentistID.toString() === filterDentist

        return matchesSearch && matchesStatus && matchesDentist
    })

    const uniqueDentists = Array.from(
        new Map(
            records
                .filter((r) => !r.isDeleted)
                .map((r) => [r.dentistID, { id: r.dentistID, name: r.dentistName || `ID: ${r.dentistID}` }])
        ).values()
    )

    const handleAddRecord = () => {
        setEditingRecord(null)
        resetTreatmentForm()
        setIsModalOpen(true)
    }

    const handleEditRecord = (record: TreatmentRecord) => {
        setEditingRecord(record)
        resetTreatmentForm({
            appointmentID: record.appointmentID,
            dentistID: record.dentistID,
            procedureID: record.procedureID,
            toothPosition: record.toothPosition,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            discountAmount: record.discountAmount,
            discountPercentage: record.discountPercentage,
            consultantEmployeeID: record.consultantEmployeeID ?? 0,
            treatmentStatus: record.treatmentStatus,
            symptoms: record.symptoms,
            diagnosis: record.diagnosis,
            treatmentDate: record.treatmentDate,
        })
        setIsModalOpen(true)
    }

    const handleToggleDelete = (id: number) => {
        const record = records.find((r) => r.treatmentRecordID === id)
        const action = record?.isDeleted ? "restore" : "delete"

        if (confirm(`Are you sure you want to ${action} this treatment record?`)) {
            setRecords((prev) =>
                prev.map((r) =>
                    r.treatmentRecordID === id
                        ? { ...r, isDeleted: !r.isDeleted, updatedAt: new Date().toISOString(), updatedBy: 1 }
                        : r,
                ),
            )
        }
    }

    const handleFormSubmit = (data: TreatmentFormData) => {
        const subtotal = data.unitPrice * data.quantity
        const discount = data.discountAmount + (subtotal * data.discountPercentage) / 100
        const totalAmount = Math.max(0, subtotal - discount)

        if (editingRecord) {
            setRecords((prev) =>
                prev.map((r) =>
                    r.treatmentRecordID === editingRecord.treatmentRecordID
                        ? {
                            ...r,
                            ...data,
                            totalAmount,
                            updatedAt: new Date().toISOString(),
                            updatedBy: 1,
                        }
                        : r,
                ),
            )
        } else {
            const newRecord: TreatmentRecord = {
                treatmentRecordID: records.length > 0 ? Math.max(...records.map((r) => r.treatmentRecordID)) + 1 : 1,
                ...data,
                totalAmount,
                appointmentDate: new Date(data.treatmentDate).toISOString().split("T")[0],
                appointmentTime: "09:00:00",
                procedureName: undefined,
                dentistName: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 1,
                updatedBy: 1,
                isDeleted: false,
            }
            setRecords((prev) => [newRecord, ...prev])
        }

        setIsModalOpen(false)
        setEditingRecord(null)
        resetTreatmentForm()
    }

    return (
        <>
            <Navigation />
            <div className="min-h-screen bg-gray-50 p-4 md:p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Hồ sơ điều trị nha khoa
                                </h2>
                                <p className="text-gray-600 mt-1">Lịch sử đầy đủ về các phương pháp điều trị và thủ thuật nha khoa</p>
                            </div>
                            <button
                                onClick={handleAddRecord}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm Hồ sơ điều trị mới
                            </button>
                        </div>

                        <div className="p-6">
                            <FilterBar register={register} dentists={uniqueDentists} />
                            <TreatmentTable
                                records={filteredRecords}
                                onEdit={handleEditRecord}
                                onToggleDelete={handleToggleDelete}
                            />
                        </div>
                    </div>

                    <SummaryStats records={records} />

                    <TreatmentModal
                        formMethods={treatmentForm}
                        isOpen={isModalOpen}
                        isEditing={!!editingRecord}
                        onClose={() => {
                            setIsModalOpen(false)
                            setEditingRecord(null)
                            resetTreatmentForm()
                        }}
                        onSubmit={handleFormSubmit}
                    />
                </div>
            </div>
        </>
    )
}

export default PatientTreatmentRecords