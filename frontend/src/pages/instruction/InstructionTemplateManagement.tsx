import { useEffect, useMemo, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PlusIcon, AlertCircle, FileText, RefreshCw } from "lucide-react"
import { InstructionTemplateTable } from "@/components/instruction/InstructionTemplateTable"
import { InstructionTemplateFormDialog } from "@/components/instruction/InstructionTemplateForm"
import { toast } from "react-toastify"
import { instructionTemplateService } from "@/services/instructionTemplateService"
import type {
  InstructionTemplate,
  CreateInstructionTemplateRequest,
  UpdateInstructionTemplateRequest,
} from "@/services/instructionTemplateService"
import { useUserInfo } from "@/hooks/useUserInfo"
import { AuthGuard } from "@/components/AuthGuard"
import { PatientLayout } from "@/layouts/patient"
import { StaffLayout } from "@/layouts/staff"
import { ConfirmModal } from "@/components/common/ConfirmModal"
import { Pagination } from "@/components/ui/Pagination"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function InstructionTemplateManagement() {
  const userInfo = useUserInfo()
  const isPatient = userInfo?.role === "Patient"
  const isAssistant = userInfo?.role === "Assistant"
  const isDentist = userInfo?.role === "Dentist"

  const [templates, setTemplates] = useState<InstructionTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Separate loading states for different actions
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<InstructionTemplate | null>(null)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<InstructionTemplate | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [searchTerm, setSearchTerm] = useState("")

  // General action loading (any action in progress)
  const actionLoading = addLoading || editLoading || deleteLoading

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await instructionTemplateService.getAll()
      setTemplates(data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Không thể tải danh sách chỉ dẫn."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates
    const searchLower = searchTerm.toLowerCase()
    return templates.filter((template) =>
      template.instruc_TemplateName.toLowerCase().includes(searchLower) ||
      template.instruc_TemplateContext.toLowerCase().includes(searchLower)
    )
  }, [templates, searchTerm])

  // Reset current page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Paginated templates
  const paginatedTemplates = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTemplates.slice(start, start + itemsPerPage)
  }, [filteredTemplates, currentPage, itemsPerPage])

  const handleAddTemplate = async (formData: CreateInstructionTemplateRequest) => {
    setAddLoading(true)
    try {
      const message = await instructionTemplateService.create(formData)
      toast.success(message)
      await fetchTemplates()
      setIsAddDialogOpen(false)
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Thêm chỉ dẫn thất bại."
      toast.error(errorMessage)
    } finally {
      setAddLoading(false)
    }
  }

  const handleUpdateTemplate = async (formData: CreateInstructionTemplateRequest) => {
    if (!selectedTemplate) {
      toast.error("Không tìm thấy mẫu chỉ dẫn cần chỉnh sửa")
      return
    }
    
    setEditLoading(true)
    try {
      const request: UpdateInstructionTemplateRequest = {
        ...formData,
        instruc_TemplateID: selectedTemplate.instruc_TemplateID,
      }
      
      const message = await instructionTemplateService.update(request)
      toast.success(message)
      
      // Clean up state
      setSelectedTemplate(null)
      setIsEditDialogOpen(false)
      await fetchTemplates()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Cập nhật chỉ dẫn thất bại."
      toast.error(errorMessage)
    } finally {
      setEditLoading(false)
    }
  }

  const confirmDeleteTemplate = (id: number) => {
    console.log("Confirming delete for ID:", id) // Debug log
    const found = templates.find(t => t.instruc_TemplateID === id)
    if (!found) {
      return
    }
    setTemplateToDelete(found)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return
    
    setDeleteLoading(true)
    try {
      const message = await instructionTemplateService.delete(templateToDelete.instruc_TemplateID)
      toast.success(message)
      setIsDeleteConfirmOpen(false)
      setTemplateToDelete(null)
      await fetchTemplates()
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Xoá chỉ dẫn thất bại."
      toast.error(errorMessage)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openAddDialog = () => {
    setSelectedTemplate(null)
    setIsAddDialogOpen(true)
  }

  const openEditDialog = useCallback((template: InstructionTemplate) => {
    setSelectedTemplate(template)
    setIsEditDialogOpen(true)
  }, [])

  const handleRetry = () => {
    fetchTemplates()
  }

  // Handle dialog close with cleanup
  const handleAddDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedTemplate(null)
    }
    setIsAddDialogOpen(open)
  }

  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedTemplate(null)
    }
    setIsEditDialogOpen(open)
  }

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header Section with Glass Effect */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-sm">
        <div className="container mx-auto py-4 px-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  Quản lý mẫu chỉ dẫn
                </h1>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <span>{templates.length} mẫu</span>
                  {filteredTemplates.length !== templates.length && (
                    <span>• {filteredTemplates.length} đã lọc</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={loading || actionLoading}
                className="bg-white/80 backdrop-blur-sm border-white/60 hover:bg-white/90"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {(isAssistant || isDentist) && (
                <Button
                  size="sm"
                  onClick={openAddDialog}
                  disabled={loading || actionLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <PlusIcon className="mr-1 h-4 w-4" />
                  Thêm mẫu
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto py-8 px-6">
        {error && (
          <div className="mb-8 animate-in slide-in-from-top duration-300">
            <Alert className="bg-red-50/80 border-red-200/60 backdrop-blur-sm shadow-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="flex items-center justify-between text-red-800">
                <span className="font-medium">{error}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="bg-white/80 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <RefreshCw className="mr-2 h-3 w-3" />
                  Thử lại
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-blue-100/50 overflow-hidden">
          <InstructionTemplateTable
            templates={paginatedTemplates}
            loading={loading}
            error={null}
            onEdit={openEditDialog}
            onDelete={confirmDeleteTemplate}
            isAssistant={isAssistant}
            isDentist={isDentist}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            actionLoading={editLoading || deleteLoading} 
          />

          {!loading && !error && (
            <div className="p-6 bg-gradient-to-r from-slate-50/50 to-blue-50/50 border-t border-white/30">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredTemplates.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                totalItems={filteredTemplates.length}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <InstructionTemplateFormDialog
        isOpen={isAddDialogOpen}
        onOpenChange={handleAddDialogClose}
        onSave={handleAddTemplate}
        title="Thêm mẫu chỉ dẫn"
        loading={addLoading}
      />

      <InstructionTemplateFormDialog
        isOpen={isEditDialogOpen}
        onOpenChange={handleEditDialogClose}
        initialData={selectedTemplate}
        onSave={handleUpdateTemplate}
        title="Chỉnh sửa mẫu chỉ dẫn"
        loading={editLoading}
      />

      <ConfirmModal
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xoá"
        message={`Bạn có chắc muốn xoá mẫu chỉ dẫn "${templateToDelete?.instruc_TemplateName}"?`}
        confirmText="Xoá"
        cancelText="Hủy"
        loading={deleteLoading}
      />
    </div>
  )

  return (
    <AuthGuard requiredRoles={["Assistant", "Dentist", "Patient"]}>
      {isPatient ? (
        <PatientLayout userInfo={userInfo}>{content}</PatientLayout>
      ) : (
        <StaffLayout userInfo={userInfo}>{content}</StaffLayout>
      )}
    </AuthGuard>
  )
}