export interface Task {
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
    description: string
    startTime: string
    endTime: string
}


export interface AssignedTask extends Task { }
