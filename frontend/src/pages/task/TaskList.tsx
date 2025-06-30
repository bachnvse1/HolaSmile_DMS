import { useState } from "react"
import { AssignTaskModal } from "@/components/task/assignTaskModal"
import { TaskCard } from "@/components/task/TaskCard"
import { TaskFilters } from "@/components/task/TaskFilters"
import { TaskStats } from "@/components/task/TaskStats"
import type { Task, TaskAssignment } from "@/types/task"

const initialTasks: Task[] = [
    {
        taskId: 1,
        progressName: "Chuẩn bị dụng cụ phẫu thuật",
        description: "Chuẩn bị và khử trùng tất cả dụng cụ cần thiết cho ca phẫu thuật nhổ răng khôn",
        status: false,
        startTime: "2024-06-28T08:00:00",
        endTime: "2024-06-28T09:00:00",
        assistantName: "Nguyễn Thị Lan",
        assistantId: 1,
    },
    {
        taskId: 2,
        progressName: "Hỗ trợ điều trị tủy răng",
        description: "Hỗ trợ bác sĩ trong quá trình điều trị tủy răng, chuẩn bị vật liệu và dụng cụ",
        status: true,
        startTime: "2024-06-27T14:00:00",
        endTime: "2024-06-27T16:00:00",
        assistantName: "Trần Văn Minh",
        assistantId: 2,
    },
    {
        taskId: 3,
        progressName: "Vệ sinh và khử trùng phòng khám",
        description: "Vệ sinh tổng thể phòng khám sau ca điều trị, khử trùng tất cả bề mặt tiếp xúc",
        status: false,
        startTime: "2024-06-28T16:00:00",
        endTime: "2024-06-28T17:00:00",
        assistantName: "Lê Thị Hoa",
        assistantId: 3,
    },
    {
        taskId: 4,
        progressName: "Chuẩn bị bệnh nhân",
        description: "Hướng dẫn bệnh nhân chuẩn bị trước khi điều trị, giải thích quy trình",
        status: false,
        startTime: "2024-06-28T10:00:00",
        endTime: "2024-06-28T10:30:00",
        assistantName: "Phạm Văn Đức",
        assistantId: 4,
    },
    {
        taskId: 5,
        progressName: "Kiểm tra thiết bị y tế",
        description: "Kiểm tra và bảo dưỡng định kỳ các thiết bị y tế trong phòng khám",
        status: false,
        startTime: "2024-06-26T09:00:00",
        endTime: "2024-06-26T11:00:00",
        assistantName: "Nguyễn Thị Lan",
        assistantId: 1,
    },
    {
        taskId: 6,
        progressName: "Hỗ trợ chụp X-quang",
        description: "Hỗ trợ bệnh nhân chụp X-quang răng, đảm bảo an toàn bức xạ",
        status: true,
        startTime: "2024-06-27T11:00:00",
        endTime: "2024-06-27T11:30:00",
        assistantName: "Trần Văn Minh",
        assistantId: 2,
    },
]

const assistants = [
    { assistantId: 1, name: "Nguyễn Thị Lan" },
    { assistantId: 2, name: "Trần Văn Minh" },
    { assistantId: 3, name: "Lê Thị Hoa" },
    { assistantId: 4, name: "Phạm Văn Đức" },
]

export default function TaskList({ treatmentProgressID }: { treatmentProgressID?: number }) {
    const [taskList, setTaskList] = useState<Task[]>(initialTasks)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("Tất cả")

    const handleTaskAssign = (task: TaskAssignment) => {
        const assignedTask: Task = {
            taskId: Date.now(),
            status: false,
            ...task,
            assistantName: assistants.find(a => a.assistantId === task.assistantId)?.name || "Không rõ"
        }
        setTaskList(prev => [...prev, assignedTask])
    }

    const handleDelete = (taskId: number) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này không?")) {
            setTaskList((prev) => prev.filter((t) => t.taskId !== taskId))
        }
    }

    const handleStatusToggle = (taskId: number) => {
        setTaskList(prev =>
            prev.map(task =>
                task.taskId === taskId ? { ...task, status: !task.status } : task
            )
        )
    }

    const filteredTasks = taskList.filter((task) => {
        const searchMatch =
            task.progressName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.assistantName?.toLowerCase().includes(searchTerm.toLowerCase())

        const statusMatch =
            statusFilter === "Tất cả" ||
            (statusFilter === "Hoàn thành" && task.status) ||
            (statusFilter === "Chưa hoàn thành" && !task.status)

        return searchMatch && statusMatch
    })

    const stats = {
        total: taskList.length,
        completed: taskList.filter((t) => t.status).length,
        notCompleted: taskList.filter((t) => !t.status).length,
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <p className="text-muted-foreground">Quản lý và theo dõi các nhiệm vụ được phân công</p>
                </div>
                <AssignTaskModal onTaskAssign={handleTaskAssign} treatmentProgressID={treatmentProgressID}/>
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
                        onToggleStatus={handleStatusToggle}
                        onDelete={handleDelete}
                    />
                ))}

                {filteredTasks.length === 0 && (
                    <div className="text-center text-muted-foreground py-8 border rounded-md">
                        Không tìm thấy nhiệm vụ nào phù hợp với tiêu chí của bạn.
                    </div>
                )}
            </div>
        </div>
    )
}
