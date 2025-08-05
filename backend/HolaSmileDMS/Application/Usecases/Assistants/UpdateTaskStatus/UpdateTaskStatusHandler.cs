using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.UpdateTaskStatus
{
    public class UpdateTaskStatusHandler : IRequestHandler<UpdateTaskStatusCommand, string>
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        private readonly IUserCommonRepository _userCommonRepository;

        public UpdateTaskStatusHandler(
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
            if (result)
            {
                try
                {
                    // Lấy treatment progress để có thông tin của nha sĩ
                    var treatmentProgress = await _taskRepository.GetTreatmentProgressByIdAsync(
                        task.TreatmentProgressID ?? 0,
                        cancellationToken);

                    if (treatmentProgress != null)
                    {
                        var dentistUserId = await _userCommonRepository
                            .GetUserIdByRoleTableIdAsync("dentist", treatmentProgress.DentistID);

                        if (dentistUserId != null)
                        {
                            var statusText = request.Status ? "đã hoàn thành" : "chưa hoàn thành";
                            var notification = new SendNotificationCommand(
                                UserId: dentistUserId.Value,
                                Title: "Cập nhật trạng thái công việc trợ lý",
                                Message: $"Tiến trình: {task.ProgressName} - {statusText}",
                                Type: "Update",
                                RelatedObjectId: null,
                                MappingUrl: "/dentist/assigned-tasks"
                            );

                            await _mediator.Send(notification, cancellationToken);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    // Vẫn trả về thành công vì việc gửi thông báo không ảnh hưởng đến logic chính
                }

                return MessageConstants.MSG.MSG97;
            }
            return result ? MessageConstants.MSG.MSG97 : MessageConstants.MSG.MSG58; // MSG31: Lưu thành công, MSG58: Thất bại
        }
    }
}
