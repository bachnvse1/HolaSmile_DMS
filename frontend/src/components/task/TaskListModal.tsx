import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import TaskList from "@/pages/task/TaskList" 

interface TaskListModalProps {
  open: boolean
  onClose: () => void
  treatmentProgressID: number
}

export default function TaskListModal({ open, onClose, treatmentProgressID }: TaskListModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Danh sách nhiệm vụ đã giao</DialogTitle>
        </DialogHeader>
        <TaskList treatmentProgressID={treatmentProgressID} />
      </DialogContent>
    </Dialog>
  )
}