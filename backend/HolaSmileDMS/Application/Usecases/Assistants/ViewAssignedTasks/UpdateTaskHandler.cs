using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.ViewAssignedTasks
{
    public class UpdateTaskHandler : IRequestHandler<UpdateTaskCommand, string>
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdateTaskHandler(
            ITaskRepository taskRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _taskRepository = taskRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
        {
            // 1. Lấy user đăng nhập
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn cần đăng nhập

            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

            // 2. Lấy Task cần cập nhật
            var task = await _taskRepository.GetTaskByIdAsync(request.TaskId, cancellationToken);
            if (task == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27); // Task không tồn tại

            // 3. Lấy TreatmentProgress để validate thời gian
            var treatmentProgress = await _taskRepository.GetTreatmentProgressByIdAsync(
                task.TreatmentProgressID ?? 0,
                cancellationToken);

            if (treatmentProgress == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Tiến trình không tồn tại

            if (treatmentProgress.EndTime == null)
                throw new InvalidOperationException("Tiến trình chưa có thời gian kết thúc cụ thể.");

            // 4. Parse & validate thời gian
            TimeSpan? startTime = null;
            TimeSpan? endTime = null;

            if (!string.IsNullOrEmpty(request.StartTime))
            {
                if (!TimeSpan.TryParseExact(request.StartTime, @"hh\:mm", null, out var st))
                    throw new FormatException("Thời gian bắt đầu không đúng định dạng HH:mm.");
                startTime = st;
            }

            if (!string.IsNullOrEmpty(request.EndTime))
            {
                if (!TimeSpan.TryParseExact(request.EndTime, @"hh\:mm", null, out var et))
                    throw new FormatException("Thời gian kết thúc không đúng định dạng HH:mm.");
                endTime = et;
            }

            // Validate thứ tự thời gian
            if (startTime.HasValue && endTime.HasValue && endTime <= startTime)
                throw new InvalidOperationException("Thời gian kết thúc phải sau thời gian bắt đầu.");

            // Validate so với EndTime của tiến trình
            var treatmentDate = treatmentProgress.EndTime.Value.Date;

            if (startTime.HasValue)
            {
                var taskStartDateTime = treatmentDate.Add(startTime.Value);
                if (taskStartDateTime > treatmentProgress.EndTime)
                    throw new InvalidOperationException(MessageConstants.MSG.MSG92);
            }

            if (endTime.HasValue)
            {
                var taskEndDateTime = treatmentDate.Add(endTime.Value);
                if (taskEndDateTime > treatmentProgress.EndTime)
                    throw new InvalidOperationException(MessageConstants.MSG.MSG92);
            }

            // 5. Cập nhật thông tin Task
            if (request.ProgressName != null)
                task.ProgressName = request.ProgressName;

            if (request.Description != null)
                task.Description = request.Description;

            if (request.Status.HasValue)
                task.Status = request.Status;

            if (startTime.HasValue)
                task.StartTime = startTime;

            if (endTime.HasValue)
                task.EndTime = endTime;

            task.UpdatedAt = DateTime.UtcNow;

            // 6. Lưu thay đổi
            var result = await _taskRepository.UpdateTaskAsync(task, cancellationToken);

            return result
                ? "Cập nhật nhiệm vụ thành công"
                : MessageConstants.MSG.MSG58; // Thất bại
        }
    }
}
