import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router"
import { toast } from "react-toastify"
import { ArrowLeft, Loader2, Edit, Trash2, Plus, FileText, User, CalendarDays } from "lucide-react"
import CreateInstructionDialog from "@/components/instruction/CreateInstruction"
import EditInstructionDialog from "@/components/instruction/EditInstruction"
import {
    getPatientInstructions,
    createInstruction,
    editInstruction,
    deactivateInstruction,
} from "@/services/instructionService"
import { instructionTemplateService } from "@/services/instructionTemplateService"
import type { InstructionDTO, InstructionTemplateDTO } from "@/services/instructionService"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { useUserInfo } from "@/hooks/useUserInfo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function InstructionsPage() {
    const { appointmentId } = useParams()
    const [instruction, setInstruction] = useState<InstructionDTO | null>(null)
    const [instructionTemplates, setInstructionTemplates] = useState<InstructionTemplateDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newInstructionContent, setNewInstructionContent] = useState("")
    const [newInstructionTemplateId, setNewInstructionTemplateId] = useState<number | string | null>(null)

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editInstructionContent, setEditInstructionContent] = useState("")
    const [editInstructionTemplateId, setEditInstructionTemplateId] = useState<number | string>("")

    const userInfo = useUserInfo()

    const fetchInstruction = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getPatientInstructions(Number(appointmentId))
            // Lấy instruction đầu tiên hoặc null nếu không có
            setInstruction(data.length > 0 ? data[0] : null)
        } catch (err) {
            toast.error("Không thể tải chỉ dẫn.")
            setError("Lỗi tải dữ liệu chỉ dẫn.")
        } finally {
            setLoading(false)
        }
    }

    const fetchInstructionTemplates = async () => {
        try {
            const data = await instructionTemplateService.getAll()
            setInstructionTemplates(data)
        } catch (err) {
            toast.error("Không thể tải mẫu chỉ dẫn.")
        }
    }

    useEffect(() => {
        if (appointmentId) {
            fetchInstruction()
            fetchInstructionTemplates()
        }
    }, [appointmentId])

    const handleCreateInstruction = async () => {
        if (!newInstructionContent.trim()) {
            toast.error("Nội dung chỉ dẫn là bắt buộc.")
            return
        }

        try {
            // Nếu không chọn mẫu (newInstructionTemplateId là null hoặc ""), truyền null
            const templateId = newInstructionTemplateId ? Number(newInstructionTemplateId) : null
            await createInstruction(Number(appointmentId), newInstructionContent, templateId)
            toast.success("Tạo chỉ dẫn thành công.")
            setIsCreateModalOpen(false)
            setNewInstructionContent("")
            setNewInstructionTemplateId(null)
            fetchInstruction()
        } catch (err: any) {
            const message = err?.response?.data?.message || "Không thể tạo chỉ dẫn."
            toast.error(message)
        }
    }

    const handleEditInstruction = async () => {
        if (!instruction || !editInstructionContent || !editInstructionTemplateId) {
            toast.error("Thiếu nội dung hoặc mẫu.")
            return
        }

        try {
            await editInstruction(instruction.instructionId, editInstructionContent, Number(editInstructionTemplateId))
            toast.success("Cập nhật chỉ dẫn thành công.")
            setIsEditModalOpen(false)
            setEditInstructionContent("")
            setEditInstructionTemplateId("")
            fetchInstruction()
        } catch (err: any) {
            const message = err?.response?.data?.message || "Không thể cập nhật chỉ dẫn."
            toast.error(message)
        }
    }

    const handleDeactivateInstruction = async () => {
        if (!instruction) return
        if (!confirm("Bạn có chắc chắn muốn hủy kích hoạt chỉ dẫn này không?")) return
        
        try {
            await deactivateInstruction(instruction.instructionId)
            toast.success("Đã hủy kích hoạt chỉ dẫn.")
            fetchInstruction()
        } catch (err: any) {
            const message = err?.response?.data?.message || "Không thể hủy chỉ dẫn."
            toast.error(message)
        }
    }

    const openEditModal = () => {
        if (!instruction) return
        setEditInstructionContent(instruction.content)
        setEditInstructionTemplateId(instruction.instruc_TemplateID)
        setIsEditModalOpen(true)
    }

    const onNewTemplateSelect = (value: string) => {
        if (value === "none") {
            // Không chọn mẫu
            setNewInstructionTemplateId(null)
            setNewInstructionContent("")
        } else {
            const templateId = Number(value)
            setNewInstructionTemplateId(templateId)
            const selected = instructionTemplates.find(t => t.instruc_TemplateID === templateId)
            setNewInstructionContent(selected?.instruc_TemplateContext || "")
        }
    }

    const onEditTemplateSelect = (value: string) => {
        const templateId = Number(value)
        setEditInstructionTemplateId(templateId)
        const selected = instructionTemplates.find(t => t.instruc_TemplateID === templateId)
        setEditInstructionContent(selected?.instruc_TemplateContext || "")
    }

    const handleGoBack = useCallback(() => {
        window.history.back()
    }, [])

    return (
        <AuthGuard requiredRoles={["Receptionist", "Assistant", "Dentist"]}>
            <StaffLayout userInfo={userInfo}>
                <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <Button variant="outline" size="sm" onClick={handleGoBack}>
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                        <h1 className="text-4xl font-extrabold text-gray-800 text-center md:text-left">
                            Chỉ dẫn cho Cuộc hẹn: <span className="text-blue-600">#{appointmentId}</span>
                        </h1>
                        <div className="flex gap-2">
                            {!instruction && userInfo?.role === "Dentist" && (
                                <CreateInstructionDialog
                                    isCreateModalOpen={isCreateModalOpen}
                                    setIsCreateModalOpen={setIsCreateModalOpen}
                                    newInstructionContent={newInstructionContent}
                                    setNewInstructionContent={setNewInstructionContent}
                                    newInstructionTemplateId={newInstructionTemplateId}
                                    onNewTemplateSelect={onNewTemplateSelect}
                                    handleCreateInstruction={handleCreateInstruction}
                                    instructionTemplates={instructionTemplates}
                                />
                            )}
                        </div>
                    </div>

                    {loading && (
                        <div className="flex flex-col justify-center items-center h-64 text-gray-600">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" />
                            <span className="text-lg">Đang tải chỉ dẫn...</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-red-600 bg-red-100 p-4 border border-red-300 rounded-lg shadow-sm">
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="max-w-4xl mx-auto">
                            {instruction ? (
                                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-500">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-xl font-semibold text-gray-800 flex justify-between items-center">
                                            <span>Chỉ dẫn của Cuộc hẹn</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={openEditModal}
                                                    className="text-gray-600 hover:text-blue-600"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    <span className="sr-only">Chỉnh sửa</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleDeactivateInstruction}
                                                    className="text-gray-600 hover:text-red-600"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Hủy kích hoạt</span>
                                                </Button>
                                            </div>
                                        </CardTitle>
                                        <CardDescription className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            Mẫu: {instruction.instruc_TemplateName || "Không sử dụng mẫu"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-3">
                                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {instruction.content}
                                            </p>
                                        </div>
                                        <div className="text-sm text-gray-500 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span>Được tạo bởi: <strong>{instruction.dentistName}</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                                <span>Ngày tạo: <strong>{new Date(instruction.createdAt).toLocaleDateString("vi-VN")}</strong></span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="shadow-lg border-dashed border-2 border-gray-300">
                                    <CardContent className="flex flex-col items-center justify-center py-12">
                                        <FileText className="h-16 w-16 text-gray-400 mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                            Chưa có chỉ dẫn
                                        </h3>
                                        <p className="text-gray-500 text-center mb-6 max-w-md">
                                            Cuộc hẹn này chưa có chỉ dẫn nào. Hãy tạo chỉ dẫn đầu tiên để hướng dẫn bệnh nhân.
                                        </p>
                                        <Button
                                            onClick={() => setIsCreateModalOpen(true)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tạo chỉ dẫn đầu tiên
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}

                    {instruction && userInfo?.role === "Dentist" && (
                        <EditInstructionDialog
                            isEditModalOpen={isEditModalOpen}
                            setIsEditModalOpen={setIsEditModalOpen}
                            editingInstruction={instruction}
                            editInstructionContent={editInstructionContent}
                            setEditInstructionContent={setEditInstructionContent}
                            editInstructionTemplateId={editInstructionTemplateId}
                            onEditTemplateSelect={onEditTemplateSelect}
                            handleEditInstruction={handleEditInstruction}
                            instructionTemplates={instructionTemplates}
                        />
                    )}
                </div>
            </StaffLayout>
        </AuthGuard>
    )
}