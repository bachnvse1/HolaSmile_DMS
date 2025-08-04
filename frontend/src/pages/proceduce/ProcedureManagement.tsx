// ProcedureManagement.tsx
import { useEffect, useState } from "react"
import { ProcedureService } from "@/services/procedureService"
import { CreateProcedureModal } from "@/components/proceduce/CreateProcedureModal"
import { EditProcedureModal } from "@/components/proceduce/EditProcedureModal"
import { ProcedureDetailModal } from "@/components/proceduce/ProcedureDetailModal"
import { ProcedureFilters } from "@/components/proceduce/ProcedureFilters"
import { ProcedureTable } from "@/components/proceduce/ProcedureTable"
import { Stethoscope } from "lucide-react"
import type { Procedure, ProcedureCreateForm, ProcedureUpdateForm } from "@/types/procedure"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { PatientLayout } from "@/layouts/patient"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "react-toastify"
import { ConfirmModal } from "@/components/common/ConfirmModal"
import { Pagination } from "@/components/ui/Pagination"

export default function ProcedureManagement() {
    const [procedures, setProcedures] = useState<Procedure[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(5)

    const [createForm, setCreateForm] = useState<ProcedureCreateForm>({
        procedureName: "",
        price: 0,
        description: "",
        discount: 0,
        originalPrice: 0,
        consumableCost: 0,
        suppliesUsed: [],
    })

    const { fullName, userId, role } = useAuth()
    const userInfo = {
        id: userId || "",
        name: fullName || "User",
        email: "",
        role: role || "",
        avatar: undefined,
    }

    const isPatient = role === "Patient"

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
    const [pendingToggleProcedure, setPendingToggleProcedure] = useState<{
        procedureId: number
        isDeleted: boolean
    } | null>(null)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, statusFilter, itemsPerPage])

    useEffect(() => {
        const fetchProcedures = async () => {
            setIsLoading(true)
            try {
                const data = await ProcedureService.getAll()
                setProcedures(data)
            } catch (err) {
                console.error("Lỗi khi tải thủ thuật:", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProcedures()
    }, [])

    const handleCreateProcedure = async () => {
        try {
            const created = await ProcedureService.create(createForm)
            const refreshed = await ProcedureService.getAll()
            setProcedures(refreshed)
            setCreateForm({
                procedureName: "",
                price: 0,
                description: "",
                discount: 0,
                originalPrice: 0,
                consumableCost: 0,
                suppliesUsed: [],
            })
            setIsCreateModalOpen(false)
            toast.success(created.message || "Tạo thủ thuật thành công")
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Tạo thủ thuật thất bại")
        }
    }

    const handleEditProcedure = (procedure: Procedure) => {
        setSelectedProcedure(procedure)
        setIsEditModalOpen(true)
    }

    const handleViewDetails = (procedure: Procedure) => {
        setSelectedProcedure(procedure)
        setIsDetailModalOpen(true)
    }

    const handleSaveProcedure = async (_procedureId: number, updatedData: ProcedureUpdateForm) => {
        try {
            const result = await ProcedureService.update(updatedData)
            const successMessage = typeof result === "string" ? result : result.message || "Cập nhật thành công"
            toast.success(successMessage)

            const refreshed = await ProcedureService.getAll()
            setProcedures(refreshed)
            setIsEditModalOpen(false)
        } catch (err: any) {
            console.error("Lỗi cập nhật:", err?.response?.data || err)
            toast.error(err?.response?.data?.message || "Cập nhật thất bại")
        }
    }

    const handleToggleActive = (procedureId: number, isDeleted: boolean) => {
        setPendingToggleProcedure({ procedureId, isDeleted })
        setIsConfirmModalOpen(true)
    }

    const handleConfirmToggle = async () => {
        if (!pendingToggleProcedure) return
        try {
            const result = await ProcedureService.toggleActive(pendingToggleProcedure.procedureId)
            const refreshed = await ProcedureService.getAll()
            setProcedures(refreshed)
            toast.success(result.message || "Cập nhật trạng thái thành công")
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Lỗi khi cập nhật trạng thái")
        } finally {
            setIsConfirmModalOpen(false)
            setPendingToggleProcedure(null)
        }
    }

    const filteredProcedures = procedures.filter((p) => {
        const matchesSearch =
            p.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && p.isDeleted === false) ||
            (statusFilter === "inactive" && p.isDeleted === true)

        return matchesSearch && matchesStatus
    })

    const clearFilters = () => {
        setSearchTerm("")
        setStatusFilter("all")
    }

    const totalPages = Math.ceil(filteredProcedures.length / itemsPerPage)
    const paginatedProcedures = filteredProcedures.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const content = (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6" />
                    <div>
                        <h1 className="text-3xl font-bold">Quản Lý Thủ Thuật</h1>
                        <p className="text-muted-foreground">Danh sách & quản lý thủ thuật y tế</p>
                    </div>
                </div>

                {(role === "Assistant" || role === "Dentist") && (
                    <CreateProcedureModal
                        isOpen={isCreateModalOpen}
                        onOpenChange={setIsCreateModalOpen}
                        form={createForm}
                        onFormChange={setCreateForm}
                        onSubmit={handleCreateProcedure}
                    />
                )}
            </div>

            <ProcedureFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                totalProcedures={procedures.length}
                filteredCount={filteredProcedures.length}
                isLoading={isLoading}
                onClearFilters={clearFilters}
                hasActiveFilters={searchTerm !== "" || statusFilter !== "all"}
            />

            <ProcedureTable
                procedures={paginatedProcedures}
                isLoading={isLoading}
                onEdit={handleEditProcedure}
                onToggleActive={handleToggleActive}
                onViewDetails={handleViewDetails}
                onClearFilters={clearFilters}
                totalProcedures={procedures.length}
                canEdit={role === "Assistant"}
            />

            {(role === "Assistant" || role === "Dentist") && (
                <EditProcedureModal
                    procedure={selectedProcedure}
                    isOpen={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    onSave={handleSaveProcedure}
                />
            )}

            <ProcedureDetailModal
                procedure={selectedProcedure}
                isOpen={isDetailModalOpen}
                onOpenChange={setIsDetailModalOpen}
                onEdit={(p) => {
                    setIsDetailModalOpen(false)
                    handleEditProcedure(p)
                }}
                role={role ?? ""}
            />

            <ConfirmModal
                open={isConfirmModalOpen}
                onOpenChange={(open) => {
                    setIsConfirmModalOpen(open)
                    if (!open) setPendingToggleProcedure(null)
                }}
                onConfirm={handleConfirmToggle}
                title="Xác Nhận Cập Nhật Trạng Thái"
                message={`Bạn có chắc muốn ${pendingToggleProcedure?.isDeleted ? "kích hoạt" : "vô hiệu hóa"
                    } thủ thuật này?`}
                confirmText="Xác Nhận"
                cancelText="Hủy"
            />
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProcedures.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
            />
        </div>
    )

    return (
        <AuthGuard requiredRoles={["Administrator", "Owner", "Receptionist", "Assistant", "Dentist", "Patient"]}>
            {isPatient ? (
                <PatientLayout userInfo={userInfo}>{content}</PatientLayout>
            ) : (
                <StaffLayout userInfo={userInfo}>{content}</StaffLayout>
            )}
        </AuthGuard>
    )
}