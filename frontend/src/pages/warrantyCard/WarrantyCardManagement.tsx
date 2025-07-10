import { useEffect, useMemo, useState } from "react"
import { toast } from "react-toastify"
import { WarrantyHeader } from "@/components/warrantyCard/WarrantyHeader"
import { WarrantyFilters } from "@/components/warrantyCard/WarrantyFilters"
import { WarrantyCardItem } from "@/components/warrantyCard/WarrantyCardItem"
import { WarrantyTable } from "@/components/warrantyCard/WarrantyTable"
import { WarrantyEmptyState } from "@/components/warrantyCard/WarrantyEmptyState"
import { CreateWarrantyDialog } from "@/components/warrantyCard/CreateWarrantyModal"
import { EditWarrantyDialog } from "@/components/warrantyCard/EditWarrantyModal"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import type { WarrantyCard, CreateWarrantyCard, EditWarrantyCard } from "@/types/warranty"
import type { TreatmentRecord } from "@/types/treatment"
import {
  fetchWarrantyCards,
  createWarrantyCard,
  updateWarrantyCard,
  deactivateWarrantyCard,
} from "@/services/warrantyCardService"
import { fetchAllTreatmentRecords } from "@/services/treatmentService"



export default function WarrantyCardManagement() {
  const [warrantyCards, setWarrantyCards] = useState<WarrantyCard[]>([])
  const [treatmentRecords, setTreatmentRecords] = useState<TreatmentRecord[]>([])
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<WarrantyCard | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [createForm, setCreateForm] = useState<CreateWarrantyCard>({ treatmentRecordId: 0, duration: 12 })
  const [editForm, setEditForm] = useState<EditWarrantyCard>({ warrantyCardId: 0, duration: 0, status: true })
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchWarrantyCards()
      .then(setWarrantyCards)
      .catch(() => toast.error("Không thể tải danh sách thẻ bảo hành"))

    fetchAllTreatmentRecords()
      .then(setTreatmentRecords)
      .catch(() => toast.error("Lỗi khi tải hồ sơ điều trị"))
  }, [])

  const filteredCards = useMemo(() => {
    return warrantyCards.filter((card) => {
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && card.status) ||
        (filterStatus === "inactive" && !card.status)
      const matchesSearch =
        searchQuery === "" ||
        card.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.procedureName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [warrantyCards, filterStatus, searchQuery])

  const availableTreatmentRecords = useMemo(() => {
    const existingRecordIds = new Set(
      warrantyCards.map((card) => card.treatmentRecordId)
    )

    return treatmentRecords.filter((record) => {
      const recordId = record.treatmentRecordID

      return (
        record.treatmentStatus?.toLowerCase() === "completed" &&
        !existingRecordIds.has(recordId)
      )
    })
  }, [treatmentRecords, warrantyCards])

  const validateCreateForm = () => {
    const errors: { [key: string]: string } = {}
    if (createForm.treatmentRecordId === 0) {
      errors.treatmentRecordId = "Vui lòng chọn hồ sơ điều trị"
    }
    if (createForm.duration <= 0 || createForm.duration > 60) {
      errors.duration = "Thời hạn phải từ 1 đến 60 tháng"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateEditForm = () => {
    const errors: { [key: string]: string } = {}
    if (editForm.duration <= 0 || editForm.duration > 60) {
      errors.duration = "Thời hạn phải từ 1 đến 60 tháng"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreate = async () => {
    if (!validateCreateForm()) return
    try {
      await createWarrantyCard(createForm)
      toast.success("Tạo thẻ bảo hành thành công.")
      setIsCreateOpen(false)
      setCreateForm({ treatmentRecordId: 0, duration: 12 })
      setFormErrors({})
      const updatedCards = await fetchWarrantyCards()
      setWarrantyCards(updatedCards)
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo thẻ bảo hành")
    }
  }

  const handleEdit = async () => {
    if (!validateEditForm() || !editingCard) return
    try {
      await updateWarrantyCard(editForm)
      toast.success("Cập nhật thẻ bảo hành thành công.")
      setIsEditOpen(false)
      setEditingCard(null)
      setFormErrors({})
      const updatedCards = await fetchWarrantyCards()
      setWarrantyCards(updatedCards)
    } catch {
      toast.error("Lỗi khi cập nhật thẻ bảo hành")
    }
  }

  const toggleStatus = async (cardId: number) => {
    try {
      await deactivateWarrantyCard(cardId)
      toast.success("Đã cập nhật trạng thái thẻ bảo hành.")
      const updatedCards = await fetchWarrantyCards()
      setWarrantyCards(updatedCards)
    } catch {
      toast.error("Không thể thay đổi trạng thái thẻ.")
    }
  }

  const openEditDialog = (card: WarrantyCard) => {
    setEditingCard(card)
    setEditForm({
      warrantyCardId: card.warrantyCardId,
      duration: card.duration,
      status: card.status,
    })
    setFormErrors({})
    setIsEditOpen(true)
  }

  const { fullName, role, userId } = useAuth()
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }

  return (
    <AuthGuard requiredRoles={["Assistant"]}>
      <StaffLayout userInfo={userInfo}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="container mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            <WarrantyHeader onCreateClick={() => setIsCreateOpen(true)} />

            <WarrantyFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              warrantyCards={warrantyCards}
            />

            <div className="space-y-6">
              {viewMode === "cards" ? (
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCards.map((card) => (
                    <WarrantyCardItem
                      key={card.warrantyCardId}
                      card={card}
                      onEdit={openEditDialog}
                      onToggleStatus={toggleStatus}
                    />
                  ))}
                </div>
              ) : (
                <WarrantyTable cards={filteredCards} onEdit={openEditDialog} onToggleStatus={toggleStatus} />
              )}

              {filteredCards.length === 0 && (
                <WarrantyEmptyState
                  searchQuery={searchQuery}
                  filterStatus={filterStatus}
                  onClearSearch={() => setSearchQuery("")}
                />
              )}
            </div>

            <CreateWarrantyDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              form={createForm}
              onFormChange={setCreateForm}
              errors={formErrors}
              onErrorChange={setFormErrors}
              availableRecords={availableTreatmentRecords}
              onSubmit={handleCreate}
            />

            <EditWarrantyDialog
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
              form={editForm}
              onFormChange={setEditForm}
              errors={formErrors}
              onErrorChange={setFormErrors}
              editingCard={editingCard}
              onSubmit={handleEdit}
            />
          </div>
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
