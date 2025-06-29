using MediatR;

namespace Application.Usecases.Assistant.ViewTaskDetails
{
    public class ViewTaskDetailsCommand : IRequest<ViewTaskDetailsDto>
    {
        public int TaskId { get; set; }

        public ViewTaskDetailsCommand(int taskId)
        {
            TaskId = taskId;
        }
    }
}
