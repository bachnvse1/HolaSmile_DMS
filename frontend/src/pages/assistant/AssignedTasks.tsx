import { useEffect, useMemo, useState } from "react"
import { TaskCard } from "@/components/assistant/TaskCard"
import { TaskFilters } from "@/components/assistant/TaskFilter"
import { TaskDetailsModal } from "@/components/assistant/TaskDetail"
import { TaskStats } from "@/components/assistant/TaskStats"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { useAuth } from "@/hooks/useAuth"
import { taskService } from "@/services/taskService"
import { toast } from "react-toastify"
import { ConfirmModal } from "@/components/common/ConfirmModal"
import { Pagination } from "@/components/ui/Pagination"
import type { Task, TaskFilter } from "@/types/task"

export default function AssignedTasks() {
  const { fullName, userId, role } = useAuth()
  const userInfo = {
    id: userId || '',
    name: fullName || 'User',
    email: '',
    role: role || '',
    avatar: undefined
  }

  const [tasks, setTasks] = useState<Task[]>([])
  const [filters, setFilters] = useState<TaskFilter>({
    status: "all",
    timeRange: "all",
    dentist: "all",
    procedure: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isLoadingTask, setIsLoadingTask] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    taskId: 0,
    toStatus: "Pending" as "Pending" | "Completed",
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await taskService.getAssignedTasks()
        setTasks(res)
      } catch (error) {
        console.error("Không thể tải danh sách nhiệm vụ:", error)
      }
    }
    fetchTasks()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchTerm])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = [
        task.progressName,
        task.description,
        task.symptoms,
        task.diagnosis,
        task.dentistName
      ].some(field => field.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = filters.status === "all" || task.status === filters.status
      const matchesDentist = filters.dentist === "all" || task.dentistName === filters.dentist
      const matchesProcedure = filters.procedure === "all" || task.procedureName === filters.procedure

      let matchesTimeRange = true
      if (filters.timeRange !== "all") {
        const hour = parseInt(task.startTime.split(":")[0])
        matchesTimeRange =
          (filters.timeRange === "morning" && hour >= 6 && hour < 12) ||
          (filters.timeRange === "afternoon" && hour >= 12 && hour < 18) ||
          (filters.timeRange === "evening" && hour >= 18 && hour < 24) ||
          (filters.timeRange === "night" && hour >= 0 && hour < 6)
      }

      return matchesSearch && matchesStatus && matchesDentist && matchesProcedure && matchesTimeRange
    })
  }, [tasks, filters, searchTerm])

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      const dateCompare = new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime()
      return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime)
    })
  }, [filteredTasks])

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sortedTasks.slice(start, start + itemsPerPage)
  }, [sortedTasks, currentPage, itemsPerPage])

  const clearFilters = () => {
    setFilters({
      status: "all",
      timeRange: "all",
      dentist: "all",
      procedure: "all",
    })
    setSearchTerm("")
  }

  const askConfirmStatusChange = (taskId: number, toStatus: "Pending" | "Completed") => {
    setConfirmModal({ open: true, taskId, toStatus })
  }

  const confirmStatusChange = async () => {
    const { taskId, toStatus } = confirmModal
    try {
      const res = await taskService.updateTaskStatus(taskId, toStatus === "Completed")

      setTasks(prev =>
        prev.map(t => t.taskId === taskId ? { ...t, status: toStatus } : t)
      )
      setSelectedTask(prev =>
        prev && prev.taskId === taskId ? { ...prev, status: toStatus } : prev
      )
      toast.success(res.message || "Đã cập nhật trạng thái")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật")
    } finally {
      setConfirmModal(prev => ({ ...prev, open: false }))
    }
  }

  const handleViewDetails = async (task: Task) => {
    setIsLoadingTask(true)
    setIsDetailsModalOpen(true)
    try {
      const data = await taskService.getTaskById(task.taskId)
      setSelectedTask(data)
    } catch {
      toast.error("Không thể tải chi tiết nhiệm vụ")
      setIsDetailsModalOpen(false)
    } finally {
      setIsLoadingTask(false)
    }
  }

  return (
    <AuthGuard requiredRoles={['Assistant']}>
      <StaffLayout userInfo={userInfo}>
        <div className="container mx-auto p-6 space-y-6">
          <TaskStats tasks={tasks} />
          <TaskFilters
            filters={filters}
            onFiltersChange={setFilters}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            totalTasks={tasks.length}
            filteredCount={filteredTasks.length}
            onClearFilters={clearFilters}
            hasActiveFilters={
              searchTerm !== "" ||
              Object.values(filters).some(v => v !== "all")
            }
            tasks={tasks}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedTasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onStatusChange={askConfirmStatusChange}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredTasks.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={filteredTasks.length}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value)
              setCurrentPage(1)
            }}
          />

          <TaskDetailsModal
            task={selectedTask}
            isOpen={isDetailsModalOpen}
            onOpenChange={setIsDetailsModalOpen}
            onStatusChange={(id, status) => askConfirmStatusChange(id, status)}
            isLoading={isLoadingTask}
          />

          <ConfirmModal
            open={confirmModal.open}
            onOpenChange={(open) => setConfirmModal(prev => ({ ...prev, open }))}
            onConfirm={confirmStatusChange}
            title="Xác nhận cập nhật"
            message={`Bạn có chắc muốn đánh dấu nhiệm vụ là ${confirmModal.toStatus === "Completed" ? "hoàn thành" : "chưa hoàn thành"}?`}
            confirmText="Xác nhận"
            cancelText="Hủy"
          />
        </div>
      </StaffLayout>
    </AuthGuard>
  )
}
