import { useEffect, useState } from "react"
import { TaskCard } from "@/components/task/TaskCard"
import { TaskFilters } from "@/components/task/TaskFilters"
import { TaskStats } from "@/components/task/TaskStats"
import { AssignTaskModal } from "@/components/task/AssignTaskModal"
import { TaskDetailModal } from "@/components/task/TaskDetailModal"
import type { BasicTask } from "@/types/task"
import { getAllTasks, taskService } from "@/services/taskService"
import { getAllAssistants } from "@/services/assistantService"
import { toast } from "react-toastify"

export default function TaskList({ treatmentProgressID }: { treatmentProgressID: number }) {
  const [taskList, setTaskList] = useState<BasicTask[]>([])
  const [assistants, setAssistants] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Tất cả")
  const [isUpdating, setIsUpdating] = useState<number | null>(null)
  const [selectedTask, setSelectedTask] = useState<BasicTask | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rawTasks, rawAssistants] = await Promise.all([
          getAllTasks(),
          getAllAssistants(),
        ])

        const tasks = rawTasks as any
        const assistantList = rawAssistants as any

        if (Array.isArray(tasks)) {
          setTaskList(tasks)
        } else {
          toast.warning(tasks?.message || "Không thể tải danh sách nhiệm vụ")
          setTaskList([])
        }

        if (Array.isArray(assistantList)) {
          setAssistants(assistantList)
        } else {
          toast.warning(assistantList?.message || "Không thể tải danh sách trợ lý")
          setAssistants([])
        }
      } catch (error: any) {
        toast.error("Có lỗi xảy ra khi tải dữ liệu")
      }
    }
    fetchData()
  }, [])

  // Hàm xử lý xem chi tiết task
  const handleViewDetail = (task: BasicTask) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  // Hàm xử lý thay đổi trạng thái task
  const handleToggleStatus = async (taskId: number) => {
    setIsUpdating(taskId)
    
    try {
      // Tìm task hiện tại để xác định trạng thái
      const currentTask = taskList.find(task => task.taskId === taskId)
      if (!currentTask) {
        toast.error("Không tìm thấy nhiệm vụ")
        return
      }

      const isCompleted = currentTask.status !== "Completed"
      
      // Gọi API để cập nhật trạng thái
      const result = await taskService.updateTaskStatus(taskId, isCompleted)
      
      // Cập nhật state local
      setTaskList(prevTasks => 
        prevTasks.map(task => 
          task.taskId === taskId 
            ? { ...task, status: isCompleted ? "Completed" : "Pending" }
            : task
        )
      )
      
      toast.success(result.message || "Cập nhật trạng thái thành công")
      
    } catch (error: any) {
      toast.error(error.message || "Không thể cập nhật trạng thái nhiệm vụ")
    } finally {
      setIsUpdating(null)
    }
  }

  // Hàm xử lý xóa task (có thể implement sau)
  const handleDeleteTask = async (taskId: number) => {
    // TODO: Implement delete functionality
    toast.info("Chức năng xóa sẽ được triển khai sau")
  }

  // Hàm refresh danh sách task sau khi assign
  const handleTaskAssign = async () => {
    try {
      const rawTasks = await getAllTasks()
      const tasks = rawTasks as any

      if (Array.isArray(tasks)) {
        setTaskList(tasks)
        toast.success("Phân công nhiệm vụ thành công")
      } else {
        toast.warning(tasks?.message || "Không thể tải lại danh sách nhiệm vụ")
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra khi tải lại dữ liệu")
    }
  }

  const filteredTasks = taskList.filter((task) => {
    const searchMatch =
      task.progressName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assistantName?.toLowerCase().includes(searchTerm.toLowerCase())

    const statusMatch =
      statusFilter === "Tất cả" ||
      (statusFilter === "Hoàn thành" && task.status === "Completed") ||
      (statusFilter === "Chưa hoàn thành" && task.status === "Pending")

    return searchMatch && statusMatch
  })

  const stats = {
    total: taskList.length,
    completed: taskList.filter((t) => t.status === "Completed").length,
    notCompleted: taskList.filter((t) => t.status === "Pending").length,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-muted-foreground">Quản lý và theo dõi các nhiệm vụ được phân công</p>
        </div>
        <AssignTaskModal
          onTaskAssign={handleTaskAssign}
          treatmentProgressID={treatmentProgressID}
          assistants={assistants}
        />
      </div>

      <TaskStats {...stats} />

      <TaskFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDeleteTask}
            onViewDetail={handleViewDetail}
            isUpdating={isUpdating === task.taskId}
          />
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-md">
            Không tìm thấy nhiệm vụ nào phù hợp với tiêu chí của bạn.
          </div>
        )}
      </div>

      {/* Modal chi tiết task */}
      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  )
}