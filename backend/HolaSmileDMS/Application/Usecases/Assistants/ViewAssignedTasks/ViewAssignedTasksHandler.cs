using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.ViewAssignedTasks
{
    public class ViewAssignedTasksHandler : IRequestHandler<ViewAssignedTasksCommand, List<AssignedTaskDto>>
    {
        private readonly ITaskRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewAssignedTasksHandler(ITaskRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<List<AssignedTaskDto>> Handle(ViewAssignedTasksCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;

            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            var assistantIdClaim = user.FindFirst("role_table_id")?.Value;

            if (role != "Assistant" || string.IsNullOrEmpty(assistantIdClaim))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            int assistantId = int.Parse(assistantIdClaim);

            var tasks = await _repository.GetTasksByAssistantIdAsync(assistantId, cancellationToken);
            return tasks;
        }
    }
}
