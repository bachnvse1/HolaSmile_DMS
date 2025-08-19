namespace Application.Usecases.UserCommon.ChatbotUserData
{
    public class AssistantData
    {
        public string Scope { get; set; } = "Dữ liệu riêng của lễ tân về nhiệm vụ ";
        public List<TaskData> TaskDatas { get; set; } = new List<TaskData>(); // Lấy ra tất cả các nhiệm vụ của lễ tân
    }
    public class TaskData
    {
        public int TaskId { get; set; }
        public string TaskName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? TaskDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string Status { get; set; }
        public string createdby { get; set; } = string.Empty; // Tên người tạo nhiệm vụ
        public string AssignedTo { get; set; } = string.Empty; // Tên người được giao nhiệm vụ
    }
}
