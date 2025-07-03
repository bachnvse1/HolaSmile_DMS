using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.UpdateTaskStatus
{
    public class UpdateTaskStatusHandler : IRequestHandler<UpdateTaskStatusCommand, string>
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateTaskStatusHandler(
            ITaskRepository taskRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _taskRepository = taskRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(UpdateTaskStatusCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var roleTableId = user?.FindFirst("role_table_id")?.Value;

            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Chưa đăng nhập

            if (role != "Assistant" || string.IsNullOrEmpty(roleTableId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

            int assistantId = int.Parse(roleTableId);

            var task = await _taskRepository.GetTaskByIdAsync(request.TaskId, cancellationToken);
            if (task == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

            if (task.AssistantID != assistantId)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền với task này

            task.Status = request.Status;
            task.UpdatedAt = DateTime.UtcNow;
            task.UpdatedBy = assistantId;

            var result = await _taskRepository.UpdateTaskAsync(task, cancellationToken);
            return result ? MessageConstants.MSG.MSG31 : MessageConstants.MSG.MSG58; // MSG31: Lưu thành công, MSG58: Thất bại
        }
    }
}
