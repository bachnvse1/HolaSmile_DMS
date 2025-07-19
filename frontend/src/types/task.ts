export interface BasicTask {
    taskId: number
    progressName: string
    description: string
    status: boolean
    startTime: string
    endTime: string
    assistantId?: number
    assistantName?: string
}

export interface TaskAssignment {
    assistantId: number
    treatmentProgressID: number
    progressName: string
    status: boolean
    description: string
    startTime: string
    endTime: string
}

export interface TaskFilter {
  status: string
  timeRange: string
  dentist: string
  procedure: string
}
export type TaskStatus = "Pending" | "Completed"

export interface Task {
  taskId: number
  progressName: string
  description: string
  status: TaskStatus
  startTime: string
  endTime: string
  treatmentProgressId: number
  treatmentRecordId: number
  treatmentDate: string
  procedureName: string
  dentistName: string
  symptoms: string
  diagnosis: string
}

export interface AssignedTask extends BasicTask { }
