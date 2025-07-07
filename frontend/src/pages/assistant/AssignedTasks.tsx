import { useState, useEffect } from "react"
import { TaskCard } from "@/components/assistant/TaskCard"
import { TaskFilters } from "@/components/assistant/TaskFilter"
import { TaskDetailsModal } from "@/components/assistant/TaskDetail"
import { TaskStats } from "@/components/assistant/TaskStats"
import { AuthGuard } from "@/components/AuthGuard"
import { StaffLayout } from "@/layouts/staff"
import { useAuth } from "@/hooks/useAuth"
import type { Task, TaskFilter } from "@/types/task"
import { taskService } from "@/services/taskService"
import { toast } from "react-toastify"

export default function AssignedTasks() {
    const [tasks, setTasks] = useState<Task[]>([])

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const tasks = await taskService.getAssignedTasks()
                console.log(tasks)
                setTasks(tasks)
            } catch (error) {
                console.error("Không thể tải danh sách nhiệm vụ:", error)
            }
        }

        fetchTasks()
    }, [])

    const { fullName, userId, role } = useAuth()
    const userInfo = {
        id: userId || '',
        name: fullName || 'User',
        email: '',
        role: role || '',
        avatar: undefined
    }

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

    const handleStatusChange = (taskId: number, status: "Pending" | "Completed") => {
        setTasks((prev) =>
            prev.map((task) => (task.taskId === taskId ? { ...task, status } : task))
        )
    }

    const handleViewDetails = async (task: Task) => {
        setIsLoadingTask(true)
        setIsDetailsModalOpen(true)
        try {
            const data = await taskService.getTaskById(task.taskId)
            setSelectedTask(data)
        } catch (error) {
            toast.error("Không thể tải chi tiết nhiệm vụ")
            setIsDetailsModalOpen(false)
        } finally {
            setIsLoadingTask(false)
        }
    }

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch =
            task.progressName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.symptoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.dentistName.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            filters.status === "all" || task.status === filters.status

        const matchesDentist = filters.dentist === "all" || task.dentistName === filters.dentist
        const matchesProcedure = filters.procedure === "all" || task.procedureName === filters.procedure

        let matchesTimeRange = true
        if (filters.timeRange !== "all") {
            const hour = parseInt(task.startTime.split(":")[0])
            if (filters.timeRange === "morning") matchesTimeRange = hour >= 6 && hour < 12
            else if (filters.timeRange === "afternoon") matchesTimeRange = hour >= 12 && hour < 18
            else if (filters.timeRange === "evening") matchesTimeRange = hour >= 18 && hour < 24
            else if (filters.timeRange === "night") matchesTimeRange = hour >= 0 && hour < 6
        }

        return matchesSearch && matchesStatus && matchesDentist && matchesProcedure && matchesTimeRange
    })

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const dateCompare = new Date(a.treatmentDate).getTime() - new Date(b.treatmentDate).getTime()
        return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime)
    })

    const clearFilters = () => {
        setFilters({
            status: "all",
            timeRange: "all",
            dentist: "all",
            procedure: "all",
        })
        setSearchTerm("")
    }

    const hasActiveFilters =
        searchTerm !== "" ||
        filters.status !== "all" ||
        filters.timeRange !== "all" ||
        filters.dentist !== "all" ||
        filters.procedure !== "all"

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
                        hasActiveFilters={hasActiveFilters}
                        tasks={tasks}
                    />
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sortedTasks.map((task) => (
                            <TaskCard
                                key={task.taskId}
                                task={task}
                                onStatusChange={handleStatusChange}
                                onViewDetails={handleViewDetails}
                            />
                        ))}
                    </div>
                    <TaskDetailsModal
                        task={selectedTask}
                        isOpen={isDetailsModalOpen}
                        onOpenChange={setIsDetailsModalOpen}
                        onStatusChange={handleStatusChange}
                        isLoading={isLoadingTask}
                    />
                </div>
            </StaffLayout>
        </AuthGuard>
    )
}
