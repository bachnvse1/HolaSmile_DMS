import { useEffect, useState } from "react"
import { TaskCard } from "@/components/task/TaskCard"
import { TaskFilters } from "@/components/task/TaskFilters"
import { TaskStats } from "@/components/task/TaskStats"
import { AssignTaskModal } from "@/components/task/AssignTaskModal"
import { TaskDetailModal } from "@/components/task/TaskDetailModal"
import type { BasicTask } from "@/types/task"
import { getAllTasks } from "@/services/taskService"
import { getAllAssistants } from "@/services/assistantService"
import { toast } from "react-toastify"

interface Assistant {
  assistantId: number
  fullname: string
  phone: string
}

export default function TaskList({ treatmentProgressID }: { treatmentProgressID: number }) {
  const [taskList, setTaskList] = useState<BasicTask[]>([])
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("Tất cả")
  const [selectedTask, setSelectedTask] = useState<BasicTask | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const fetchTasksData = async () => {
    try {
      const rawTasks = await getAllTasks()
      const tasks = rawTasks as any

      if (Array.isArray(tasks)) {
        const filteredTasks = tasks.filter(task => 
          task.treatmentProgressId === treatmentProgressID
        )
        setTaskList(filteredTasks)
      } else {
        setTaskList([])
      }
    } catch (error: any) {
      toast.error("Có lỗi xảy ra khi tải danh sách nhiệm vụ")
    }
  }

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
          const filteredTasks = tasks.filter(task => 
            task.treatmentProgressId === treatmentProgressID
          )
          setTaskList(filteredTasks)
        } else {
          setTaskList([])
        }

        if (Array.isArray(assistantList)) {
          setAssistants(assistantList)
        } else {
          setAssistants([])
        }
      } catch (error: any) {
        toast.error("Có lỗi xảy ra khi tải dữ liệu")
      }
    }
    fetchData()
  }, [treatmentProgressID]) 

  const handleViewDetail = (task: BasicTask) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  const handleTaskAssign = async () => {
    await fetchTasksData()
  }

  const handleTaskUpdate = async () => {
    await fetchTasksData()
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
            onViewDetail={handleViewDetail}
            onTaskUpdate={handleTaskUpdate}
            assistants={assistants}
          />
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border rounded-md">
            Không tìm thấy nhiệm vụ nào phù hợp với tiêu chí của bạn.
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  )
}