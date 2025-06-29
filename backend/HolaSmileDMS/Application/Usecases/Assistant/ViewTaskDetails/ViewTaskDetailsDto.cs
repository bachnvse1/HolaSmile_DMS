namespace Application.Usecases.Assistant.ViewTaskDetails
{
    public class ViewTaskDetailsDto
    {
        // Task info
        public int TaskId { get; set; }
        public string ProgressName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string StartTime { get; set; } = null!;
        public string EndTime { get; set; } = null!;

        // Treatment Progress
        public int TreatmentProgressId { get; set; }
        public DateTime TreatmentDate { get; set; }
        public string? Symptoms { get; set; }
        public string? Diagnosis { get; set; }

        // Treatment Record
        public int TreatmentRecordId { get; set; }
        public string ProcedureName { get; set; } = null!;
        public string DentistName { get; set; } = null!;
    }
}
