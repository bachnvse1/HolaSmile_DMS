using MediatR;

namespace Application.Usecases.Assistant.UpdateTaskStatus
{
    public class UpdateTaskStatusCommand : IRequest<string>
    {
        public int TaskId { get; set; }
        public bool Status { get; set; }
    }
}
