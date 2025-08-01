import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import type { InstructionTemplateDTO } from "@/services/instructionService"

interface CreateInstructionDialogProps {
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (isOpen: boolean) => void
  newInstructionContent: string
  setNewInstructionContent: (content: string) => void
  newInstructionTemplateId: number | string | null
  onNewTemplateSelect: (value: string) => void
  handleCreateInstruction: () => void
  instructionTemplates: InstructionTemplateDTO[]
}

export default function CreateInstructionDialog({
  isCreateModalOpen,
  setIsCreateModalOpen,
  newInstructionContent,
  setNewInstructionContent,
  newInstructionTemplateId,
  onNewTemplateSelect,
  handleCreateInstruction,
  instructionTemplates,
}: CreateInstructionDialogProps) {
  return (
    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors duration-200 w-full md:w-auto">
          <Plus className="mr-2 h-5 w-5" /> Tạo chỉ dẫn Mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Tạo chỉ dẫn Mới</DialogTitle>
          <DialogDescription>Điền thông tin chi tiết cho chỉ dẫn mới.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newTemplate" className="text-right font-medium">
              Chọn Mẫu
            </Label>
            <Select onValueChange={onNewTemplateSelect} value={newInstructionTemplateId ? String(newInstructionTemplateId) : "none"}>
              <SelectTrigger id="newTemplate" className="col-span-3">
                <SelectValue placeholder="Chọn một mẫu chỉ dẫn (tùy chọn)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không sử dụng mẫu</SelectItem>
                {instructionTemplates.map((template) => (
                  <SelectItem key={template.instruc_TemplateID} value={String(template.instruc_TemplateID)}>
                    {template.instruc_TemplateName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newContent" className="text-right font-medium">
              Nội dung
            </Label>
            <Textarea
              id="newContent"
              value={newInstructionContent}
              onChange={(e) => setNewInstructionContent(e.target.value)}
              className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nhập nội dung chỉ dẫn..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateInstruction} className="bg-blue-600 hover:bg-blue-700 text-white">
            Tạo chỉ dẫn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}