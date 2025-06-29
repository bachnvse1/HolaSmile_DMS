using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Dentist.AssignTasksToAssistantHandler;

public class AssignTaskToAssistantHandler : IRequestHandler<AssignTaskToAssistantCommand, string>
{
    private readonly ITaskRepository _taskRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMediator _mediator;
    private readonly IUserCommonRepository _userCommonRepository;

    public AssignTaskToAssistantHandler(
        ITaskRepository taskRepository,
        IHttpContextAccessor httpContextAccessor,
        IMediator mediator,
        IUserCommonRepository userCommonRepository)
    {
        _taskRepository = taskRepository;
        _httpContextAccessor = httpContextAccessor;
        _mediator = mediator;
        _userCommonRepository = userCommonRepository;
    }

    public async Task<string> Handle(AssignTaskToAssistantCommand request, CancellationToken cancellationToken)
    {
        // ✅ Lấy thông tin người dùng hiện tại
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn cần đăng nhập

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

        // ✅ Parse StartTime & EndTime từ chuỗi string
        if (!TimeSpan.TryParse(request.StartTime, out var startTime))
            throw new FormatException(MessageConstants.MSG.MSG91);

        if (!TimeSpan.TryParse(request.EndTime, out var endTime))
            throw new FormatException(MessageConstants.MSG.MSG91);

        // ✅ Tạo Task mới
        var task = new Task
        {
            AssistantID = request.AssistantId,
            TreatmentProgressID = request.TreatmentProgressId,
            ProgressName = request.ProgressName,
            Description = request.Description,
            Status = request.Status,
            StartTime = startTime,
            EndTime = endTime,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        var result = await _taskRepository.CreateTaskAsync(task, cancellationToken);

        if (result)
        {
            var assistantUserId = await _userCommonRepository
                .GetUserIdByRoleTableIdAsync("assistant", request.AssistantId);

            if (assistantUserId != null)
            {
                var notification = new SendNotificationCommand(
                    UserId: assistantUserId.Value,
                    Title: "Bạn có nhiệm vụ mới",
                    Message: $"Tiến trình: {request.ProgressName}",
                    Type: "task_assigned",
                    RelatedObjectId: null
                );

                await _mediator.Send(notification, cancellationToken);
            }

            return MessageConstants.MSG.MSG46; // Giao việc cho trợ lý thành công
        }

        return MessageConstants.MSG.MSG58; // Cập nhật dữ liệu thất bại
    }
}
