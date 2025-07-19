namespace Application.Usecases.Assistant.ViewAssignedTasks
{
    public class AssignedTaskDto
    {
        // Task
        public int TaskId { get; set; }
        public string? ProgressName { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = default!;
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }

        // Treatment Progress
        public int TreatmentProgressId { get; set; }
        public DateTime? TreatmentDate { get; set; }
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }

        // Treatment Record
        public int TreatmentRecordId { get; set; }
        public string? ProcedureName { get; set; }
        public string? DentistName { get; set; }
    }
}
