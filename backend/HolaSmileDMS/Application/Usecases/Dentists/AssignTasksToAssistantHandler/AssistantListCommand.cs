using MediatR;
using System.Collections.Generic;

namespace Application.Usecases.Dentists.AssignTasksToAssistantHandler
{
    public class ViewListAssistantCommand : IRequest<List<AssistantListDto>>
    {
    }
}
