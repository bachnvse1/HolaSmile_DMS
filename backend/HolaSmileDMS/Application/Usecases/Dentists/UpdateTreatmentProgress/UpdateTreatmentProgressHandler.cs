using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using Application.Usecases.SendNotification;
using AutoMapper;

namespace Application.Usecases.Dentist.UpdateTreatmentProgress
{
    public class UpdateTreatmentProgressHandler : IRequestHandler<UpdateTreatmentProgressCommand, bool>
    {
        private readonly ITreatmentProgressRepository _repository;
        private readonly ITreatmentRecordRepository _treatmentRecordRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediator _mediator;
        private readonly IUserCommonRepository _userCommonRepository;

        private static readonly string[] AllowedStatuses = { "pending", "in-progress", "completed", "canceled" };

        public UpdateTreatmentProgressHandler(
            ITreatmentProgressRepository repository,
            IHttpContextAccessor httpContextAccessor, IUserCommonRepository userCommonRepository, IMediator mediator, ITreatmentRecordRepository treatmentRecordRepository)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _mediator = mediator;
            _userCommonRepository = userCommonRepository;
            _treatmentRecordRepository = treatmentRecordRepository;
        }

        public async Task<bool> Handle(UpdateTreatmentProgressCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG17);

            var role   = user.FindFirstValue(ClaimTypes.Role);
            var userId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

            // ────────────────────────────────────────
            // 1. Lấy tiến trình & kiểm tra tồn tại
            // ────────────────────────────────────────
            var progress = await _repository.GetByIdAsync(request.TreatmentProgressID, cancellationToken);
            if (progress == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

            // ────────────────────────────────────────
            // 2. Kiểm tra quyền cập nhật theo role
            // ────────────────────────────────────────
            EnsureUserCanEdit(role, progress.Status);

            // ────────────────────────────────────────
            // 3. Validate dữ liệu cập nhật
            // ────────────────────────────────────────
            ValidateRequest(request, progress);

            // ────────────────────────────────────────
            // 4. Mapping dữ liệu mới
            // ────────────────────────────────────────
            if (request.ProgressName is not null)    progress.ProgressName    = request.ProgressName.Trim();
            if (request.ProgressContent is not null) progress.ProgressContent = request.ProgressContent.Trim();
            if (request.Status is not null)          progress.Status          = request.Status.Trim();
            if (request.Duration.HasValue)           progress.Duration        = request.Duration;
            if (request.Description is not null)     progress.Description     = request.Description.Trim();
            if (request.EndTime.HasValue)            progress.EndTime         = request.EndTime;
            if (request.Note is not null)            progress.Note            = request.Note.Trim();

            progress.UpdatedAt = DateTime.Now;
            progress.UpdatedBy = userId;
            
            // ────────────────────────────────────────
            // 5. Commit
            // ────────────────────────────────────────
            var updateSuccess = await _repository.UpdateAsync(progress, cancellationToken);
            if (updateSuccess)
            {
                var treatmentDate = progress.EndTime?.ToString("dd/MM/yyyy") ?? "chưa xác định";
                await UpdateTreatmentRecordStatusIfCompleted(progress, cancellationToken);
                // 1. Gửi cho bệnh nhân
                await _mediator.Send(new SendNotificationCommand(
                    await _userCommonRepository.GetUserIdByRoleTableIdAsync("patient", progress.PatientID) ?? 0,
                    "Cập nhật tiến trình điều trị",
                    $"Tiến trình điều trị #{progress.TreatmentProgressID} của bạn đã được cập nhật sang ngày {treatmentDate}.",
                    "Tiến trình điều trị",
                    0, $"patient/view-treatment-progress/{progress.TreatmentRecordID}?patientId={progress.PatientID}&dentistId={progress.DentistID}"
                ), cancellationToken);

                // 2. Gửi cho bác sĩ
                await _mediator.Send(new SendNotificationCommand(
                    await _userCommonRepository.GetUserIdByRoleTableIdAsync("dentist", progress.DentistID) ?? 0,
                    "Tiến trình đã được cập nhật",
                     $"Tiến trình điều trị #{progress.TreatmentProgressID} của bệnh nhân đã được cập nhật.",
                    "Tiến trình điều trị",
                    progress.TreatmentProgressID, $"patient/view-treatment-progress/{progress.TreatmentRecordID}?patientId={progress.PatientID}&dentistId={progress.DentistID}"
                ), cancellationToken);
                return true;
            }

            return false;
        }

        // ───────────────────────────────────────────
        // LOCAL FUNCTIONS
        // ───────────────────────────────────────────
        static void EnsureUserCanEdit(string? role, string? currentStatus)
        {
            switch (role)
            {
                case "Dentist":
                    return; // Luôn cho phép
                default:
                    throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền
            }
        }

        static void ValidateRequest(UpdateTreatmentProgressCommand req, TreatmentProgress current)
        {
            // ProgressName
            if (req.ProgressName != null && string.IsNullOrWhiteSpace(req.ProgressName))
                throw new ArgumentException("Tên tiến trình không được để trống.");

            // Status (nếu có)
            if (req.Status != null &&
                !AllowedStatuses.Any(s => s.Equals(req.Status, StringComparison.OrdinalIgnoreCase)))
                throw new ArgumentException("Trạng thái tiến trình không hợp lệ.");

            // Duration (nếu có)
            if (req.Duration.HasValue && req.Duration < 0)
                throw new ArgumentException("Thời lượng phải lớn hơn hoặc bằng 0.");

            // EndTime (nếu có) – không được nhỏ hơn CreatedAt hiện tại của entity
            var endTime = req.EndTime ?? current.EndTime;
            if (endTime.HasValue && endTime < current.CreatedAt)
                throw new ArgumentException("Thời gian kết thúc không thể nhỏ hơn thời gian tạo");
        }
        private async System.Threading.Tasks.Task UpdateTreatmentRecordStatusIfCompleted(TreatmentProgress progress, CancellationToken cancellationToken)
        {
            if (!progress.Status?.Equals("completed", StringComparison.OrdinalIgnoreCase) ?? true)
                return;

            var allProgresses = await _repository.GetByTreatmentRecordIdAsync(progress.TreatmentRecordID, cancellationToken);
            if (allProgresses.All(p => p.Status?.Equals("completed", StringComparison.OrdinalIgnoreCase) == true))
            {
                // You need to inject ITreatmentRecordRepository as _treatmentRecordRepository
                var treatmentRecord = await _treatmentRecordRepository.GetTreatmentRecordByIdAsync(progress.TreatmentRecordID, cancellationToken);
                if (treatmentRecord != null)
                {
                    treatmentRecord.TreatmentStatus = "completed";
                    treatmentRecord.UpdatedAt = DateTime.Now;
                    treatmentRecord.UpdatedBy = progress.UpdatedBy;
                    await _treatmentRecordRepository.UpdatedTreatmentRecordAsync(treatmentRecord, cancellationToken);
                }
            }
        }
    }
}
