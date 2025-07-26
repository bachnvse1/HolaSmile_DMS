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
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn cần đăng nhập

        var role = user.FindFirst(ClaimTypes.Role)?.Value;
        var userId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

        if (!TimeSpan.TryParseExact(request.StartTime, @"hh\:mm", null, out var startTime))
            throw new FormatException("Thời gian bắt đầu không đúng định dạng HH:mm.");

        if (!TimeSpan.TryParseExact(request.EndTime, @"hh\:mm", null, out var endTime))
            throw new FormatException("Thời gian kết thúc không đúng định dạng HH:mm.");

        if (endTime <= startTime)
            throw new InvalidOperationException("Thời gian kết thúc phải sau thời gian bắt đầu.");

        // Lấy tiến trình điều trị
        var treatmentProgress = await _taskRepository.GetTreatmentProgressByIdAsync(request.TreatmentProgressId, cancellationToken);
        if (treatmentProgress == null)
            throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

        if (treatmentProgress.EndTime == null)
            throw new InvalidOperationException("Tiến trình chưa có thời gian kết thúc cụ thể.");

        // So sánh thời gian task phải trước EndTime của tiến trình
        var treatmentDate = treatmentProgress.EndTime.Value.Date;
        var taskStartDateTime = treatmentDate.Add(startTime);
        var taskEndDateTime = treatmentDate.Add(endTime);

        if (taskStartDateTime > treatmentProgress.EndTime || taskEndDateTime > treatmentProgress.EndTime)
            throw new InvalidOperationException(MessageConstants.MSG.MSG92); // Thời gian vượt quá tiến trình

        // Tạo Task mới
        var task = new Task
        {
            AssistantID = request.AssistantId,
            TreatmentProgressID = request.TreatmentProgressId,
            ProgressName = request.ProgressName,
            Description = request.Description,
            Status = request.Status,
            StartTime = startTime,
            EndTime = endTime,
            CreatedAt = DateTime.Now,
            CreatedBy = userId
        };

        var result = await _taskRepository.CreateTaskAsync(task, cancellationToken);

        if (result)
        {
            try
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
                        RelatedObjectId: null,
                        ""
                    );

                    await _mediator.Send(notification, cancellationToken);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Message);
            }

            return MessageConstants.MSG.MSG46; // Giao việc thành công
        }


        return MessageConstants.MSG.MSG58; // Cập nhật thất bại
    }
}
