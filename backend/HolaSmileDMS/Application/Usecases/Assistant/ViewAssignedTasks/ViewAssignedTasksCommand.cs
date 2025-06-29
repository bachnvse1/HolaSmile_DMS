using MediatR;

namespace Application.Usecases.Assistant.ViewAssignedTasks
{
    public class ViewAssignedTasksCommand : IRequest<List<AssignedTaskDto>>
    {
    }
}
