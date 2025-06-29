namespace Application.Usecases.Assistant.ViewAssignedTasks
{
    public class AssignedTaskDto
    {
        public int TaskId { get; set; }
        public string ProgressName { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }
}
