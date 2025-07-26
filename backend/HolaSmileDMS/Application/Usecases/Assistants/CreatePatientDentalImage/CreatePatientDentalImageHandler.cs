using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.CreatePatientDentalImage
{
    public class CreatePatientDentalImageHandler : IRequestHandler<CreatePatientDentalImageCommand, string>
    {
        private readonly IPatientRepository _patientRepo;
        private readonly IImageRepository _imageRepo;
        private readonly ICloudinaryService _cloudService;
        private readonly IHttpContextAccessor _httpContext;
        private readonly ITreatmentRecordRepository _treatmentRecordRepo;
        private readonly IOrthodonticTreatmentPlanRepository _orthoPlanRepo;

        public CreatePatientDentalImageHandler(
            IPatientRepository patientRepo,
            IImageRepository imageRepo,
            ICloudinaryService cloudService,
            IHttpContextAccessor httpContext,
            ITreatmentRecordRepository treatmentRecordRepo,
            IOrthodonticTreatmentPlanRepository orthoPlanRepo)
        {
            _patientRepo = patientRepo;
            _imageRepo = imageRepo;
            _cloudService = cloudService;
            _httpContext = httpContext;
            _treatmentRecordRepo = treatmentRecordRepo;
            _orthoPlanRepo = orthoPlanRepo;
        }

        public async Task<string> Handle(CreatePatientDentalImageCommand request, CancellationToken cancellationToken)
        {
            var role = _httpContext.HttpContext.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var patient = await _patientRepo.GetPatientByPatientIdAsync(request.PatientId);
            if (patient == null)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG27);

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp", "image/tiff", "image/heic" };

            if (!allowedTypes.Contains(request.ImageFile.ContentType))
                throw new ArgumentException("Vui lòng chọn ảnh có định dạng jpeg/png/bmp/gif/webp/tiff/heic");

            if (request.TreatmentRecordId == null && request.OrthodonticTreatmentPlanId == null)
                throw new ArgumentException("Bạn cần chọn Hồ sơ bệnh nhân hoặc Kế hoạch chỉnh nha");

            if (request.TreatmentRecordId != null && request.OrthodonticTreatmentPlanId != null)
                throw new ArgumentException("Chỉ được chọn một trong hai: Hồ sơ bệnh nhân hoặc Kế hoạch chỉnh nha");

            if (request.TreatmentRecordId.HasValue)
            {
                var record = await _treatmentRecordRepo.GetTreatmentRecordByIdAsync(request.TreatmentRecordId.Value, cancellationToken);
                if (record == null)
                    throw new KeyNotFoundException("Hồ sơ điều trị không tồn tại");
            }

            if (request.OrthodonticTreatmentPlanId.HasValue)
            {
                var plan = await _orthoPlanRepo.GetPlanByPlanIdAsync(request.OrthodonticTreatmentPlanId.Value, cancellationToken);
                if (plan == null)
                    throw new KeyNotFoundException("Kế hoạch chỉnh nha không tồn tại");
            }
            var relatedId = request.TreatmentRecordId ?? request.OrthodonticTreatmentPlanId;

            var imageUrl = await _cloudService.UploadImageAsync(request.ImageFile);

            var image = new Image
            {
                PatientId = request.PatientId,
                ImageURL = imageUrl,
                Description = request.Description,
                CreatedAt = DateTime.Now,
                CreatedBy = int.Parse(_httpContext.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0"),
                IsDeleted = false,
                TreatmentRecordId = request.TreatmentRecordId,
                OrthodonticTreatmentPlanId = request.OrthodonticTreatmentPlanId
            };

            var isCreated = await _imageRepo.CreateAsync(image);

            if (!isCreated)
                throw new Exception("Không thể lưu ảnh vào hệ thống");
            return MessageConstants.MSG.MSG113;

        }
    }
}
