import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, User, FileText, Edit, Trash2 } from "lucide-react"
import type { InstructionDTO } from "@/services/instructionService"

interface InstructionListProps {
  instructions: InstructionDTO[]
  openEditModal: (instruction: InstructionDTO) => void
  handleDeactivateInstruction: (instructionId: number) => void
}

export default function InstructionList({
  instructions,
  openEditModal,
  handleDeactivateInstruction,
}: InstructionListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {instructions.map((instruction) => (
        <Card
          key={instruction.instructionId}
          className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-500"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-semibold text-gray-800 flex justify-between items-center">
              <span>Chỉ dẫn</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(instruction)}
                  className="text-gray-600 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Chỉnh sửa</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeactivateInstruction(instruction.instructionId)}
                  className="text-gray-600 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Hủy kích hoạt</span>
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <FileText className="h-4 w-4 text-blue-500" />
              Mẫu: {instruction.instruc_TemplateName}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <p className="text-base text-gray-700 mb-3 leading-relaxed">{instruction.content}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span>Bởi: {instruction.dentistName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-gray-400" />
                <span>Ngày tạo: {new Date(instruction.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
