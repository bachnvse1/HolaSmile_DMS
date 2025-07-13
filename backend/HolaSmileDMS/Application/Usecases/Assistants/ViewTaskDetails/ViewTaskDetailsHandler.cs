using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistant.ViewTaskDetails
{
    public class ViewTaskDetailsHandler : IRequestHandler<ViewTaskDetailsCommand, ViewTaskDetailsDto>
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewTaskDetailsHandler(ITaskRepository taskRepository, IHttpContextAccessor httpContextAccessor)
        {
            _taskRepository = taskRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<ViewTaskDetailsDto> Handle(ViewTaskDetailsCommand request, CancellationToken cancellationToken)
        {
            // ✅ Lấy assistantID từ token
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;
            var roleTableId = user?.FindFirst("role_table_id")?.Value;

            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn cần đăng nhập

            if (role != "Assistant" || string.IsNullOrEmpty(roleTableId))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập

            int assistantId = int.Parse(roleTableId);

            // ✅ Lấy Task từ repository
            var task = await _taskRepository.GetTaskByIdAsync(request.TaskId, cancellationToken);

            if (task == null || task.TreatmentProgress == null || task.TreatmentProgress.TreatmentRecord == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG16); // Không có dữ liệu phù hợp

            // ✅ Kiểm tra quyền sở hữu Task
            if (task.AssistantID != assistantId)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền truy cập

            var treatmentProgress = task.TreatmentProgress;
            var treatmentRecord = treatmentProgress.TreatmentRecord;
            var dentistName = treatmentRecord.Dentist?.User?.Fullname ?? "Không xác định";

            return new ViewTaskDetailsDto
            {
                // Task info
                TaskId = task.TaskID,
                ProgressName = task.ProgressName ?? "",
                Description = task.Description ?? "",
                Status = task.Status == true ? "Hoàn thành" : "Chưa hoàn thành",
                StartTime = task.StartTime?.ToString(@"hh\:mm") ?? "",
                EndTime = task.EndTime?.ToString(@"hh\:mm") ?? "",

                // Treatment Progress
                TreatmentProgressId = treatmentProgress.TreatmentProgressID,
                TreatmentDate = treatmentRecord.TreatmentDate,
                Symptoms = treatmentRecord.Symptoms,
                Diagnosis = treatmentRecord.Diagnosis,

                // Treatment Record
                TreatmentRecordId = treatmentRecord.TreatmentRecordID,
                ProcedureName = treatmentRecord.Procedure?.ProcedureName ?? "Không xác định",
                DentistName = dentistName
            };
        }
    }
}
