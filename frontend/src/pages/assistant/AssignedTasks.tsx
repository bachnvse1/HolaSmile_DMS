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
import { Calendar, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button2"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Task, TaskFilter } from "@/types/task"

interface TaskGroup {
  date: string
  tasks: Task[]
  displayDate: string
  isToday: boolean
  isPast: boolean
}

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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

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

  // Helper function to format date groups
  const formatDateGroup = (dateString: string, isToday: boolean) => {
    if (isToday) return "Hôm nay"
    
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return "Ngày mai"
    if (diffDays === -1) return "Hôm qua"
    if (diffDays > 0 && diffDays <= 7) return `${diffDays} ngày nữa`
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} ngày trước`
    
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

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

  // Group tasks by date and sort
  const groupedTasks = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    // Group tasks by date
    const groups = filteredTasks.reduce((acc, task) => {
      const date = task.treatmentDate
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(task)
      return acc
    }, {} as Record<string, Task[]>)

    // Convert to array and sort by date (newest first)
    const sortedGroups: TaskGroup[] = Object.entries(groups)
      .map(([date, tasks]) => {
        const taskDate = new Date(date)
        const isToday = date === todayStr
        const isPast = taskDate < today && !isToday
        
        // Sort tasks within each group by time
        const sortedTasks = tasks.sort((a, b) => a.startTime.localeCompare(b.startTime))
        
        return {
          date,
          tasks: sortedTasks,
          displayDate: formatDateGroup(date, isToday),
          isToday,
          isPast
        }
      })
      .sort((a, b) => {
        // Sort groups: today first, then future dates, then past dates
        if (a.isToday) return -1
        if (b.isToday) return 1
        
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        
        // If both are future or both are past, sort by date
        return dateB.getTime() - dateA.getTime()
      })

    return sortedGroups
  }, [filteredTasks, formatDateGroup])

  // Pagination for groups
  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return groupedTasks.slice(start, start + itemsPerPage)
  }, [groupedTasks, currentPage, itemsPerPage])

  const toggleGroupCollapse = (date: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(date)) {
      newCollapsed.delete(date)
    } else {
      newCollapsed.add(date)
    }
    setCollapsedGroups(newCollapsed)
  }

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

  const totalFilteredTasks = filteredTasks.length

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
            filteredCount={totalFilteredTasks}
            onClearFilters={clearFilters}
            hasActiveFilters={
              searchTerm !== "" ||
              Object.values(filters).some(v => v !== "all")
            }
            tasks={tasks}
          />

          <div className="space-y-4">
            {paginatedGroups.map((group) => {
              const isCollapsed = collapsedGroups.has(group.date)
              const completedCount = group.tasks.filter(t => t.status === "Completed").length
              
              return (
                <Card key={group.date} className={`${group.isToday ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleGroupCollapse(group.date)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 ${group.isToday ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        <div>
                          <h3 className={`font-semibold text-lg ${group.isToday ? 'text-blue-600' : ''}`}>
                            {group.displayDate}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {group.tasks.length} nhiệm vụ • {completedCount} hoàn thành
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {!isCollapsed && (
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {group.tasks.map((task) => (
                          <TaskCard
                            key={task.taskId}
                            task={task}
                            onStatusChange={askConfirmStatusChange}
                            onViewDetails={handleViewDetails}
                          />
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )
            })}
          </div>

          {groupedTasks.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại</p>
              </CardContent>
            </Card>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(groupedTasks.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            totalItems={groupedTasks.length}
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