using MediatR;

namespace Application.Usecases.Assistants.ViewAssignedTasks
{
    public class UpdateTaskCommand : IRequest<string>
    {
        public int TaskId { get; set; }              // Gửi trong body
        public string? ProgressName { get; set; }
        public string? Description { get; set; }
        public bool? Status { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
    }
}
