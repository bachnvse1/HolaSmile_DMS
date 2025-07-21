import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InstructionDTO, InstructionTemplateDTO } from "@/services/instructionService"

interface EditInstructionDialogProps {
  isEditModalOpen: boolean
  setIsEditModalOpen: (isOpen: boolean) => void
  editingInstruction: InstructionDTO | null
  editInstructionContent: string
  setEditInstructionContent: (content: string) => void
  editInstructionTemplateId: number | string
  onEditTemplateSelect: (value: string) => void
  handleEditInstruction: () => void
  instructionTemplates: InstructionTemplateDTO[]
}

export default function EditInstructionDialog({
  isEditModalOpen,
  setIsEditModalOpen,
  editInstructionContent,
  setEditInstructionContent,
  editInstructionTemplateId,
  onEditTemplateSelect,
  handleEditInstruction,
  instructionTemplates,
}: EditInstructionDialogProps) {
  return (
    <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Chỉnh sửa chỉ dẫn</DialogTitle>
          <DialogDescription>Thực hiện thay đổi cho chỉ dẫn này.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editTemplate" className="text-right font-medium">
              Chọn Mẫu
            </Label>
            <Select onValueChange={onEditTemplateSelect} value={String(editInstructionTemplateId)}>
              <SelectTrigger id="editTemplate" className="col-span-3">
                <SelectValue placeholder="Chọn một mẫu chỉ dẫn" />
              </SelectTrigger>
              <SelectContent>
                {instructionTemplates.map((template) => (
                  <SelectItem key={template.instruc_TemplateID} value={String(template.instruc_TemplateID)}>
                    {template.instruc_TemplateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="editContent" className="text-right font-medium">
              Nội dung
            </Label>
            <Textarea
              id="editContent"
              value={editInstructionContent}
              onChange={(e) => setEditInstructionContent(e.target.value)}
              className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleEditInstruction} className="bg-blue-600 hover:bg-blue-700 text-white">
            Lưu Thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
