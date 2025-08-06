using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.DeactivePatientDentalImage
{
    public class DeactivePatientDentalImageHandler : IRequestHandler<DeactivePatientDentalImageCommand, string>
    {
        private readonly IImageRepository _imageRepo;
        private readonly IHttpContextAccessor _httpContext;
        private readonly IMediator _mediator;
        public DeactivePatientDentalImageHandler(IImageRepository imageRepo, IHttpContextAccessor httpContext, IMediator mediator)
        {
            _imageRepo = imageRepo;
            _httpContext = httpContext;
            _mediator = mediator;
        }

        public async Task<string> Handle(DeactivePatientDentalImageCommand request, CancellationToken cancellationToken)
        {
            var role = _httpContext.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist" && role != "Patient")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var userId = int.Parse(_httpContext.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            var image = await _imageRepo.GetByIdAsync(request.ImageId);
            if (image == null || image.IsDeleted)
                throw new KeyNotFoundException("Không tìm thấy ảnh hoặc ảnh đã bị xoá.");

            image.IsDeleted = true;
            image.UpdatedAt = DateTime.Now;
            image.UpdatedBy = userId;

            var success = await _imageRepo.UpdateAsync(image);
            if (!success)
                throw new Exception("Không thể xoá ảnh khỏi hệ thống.");

            Console.WriteLine(image.Patient?.User?.UserID);

            // ✅ Gửi notification trong try/catch
            try
            {
                var patientUserId = image.Patient?.User?.UserID ?? 0;

                if (patientUserId > 0)
                {
                    await _mediator.Send(new SendNotificationCommand(
                        patientUserId,
                        "Xoá ảnh nha khoa",
                        "Một ảnh nha khoa trong hồ sơ của bạn vừa bị xoá.",
                        "Delete",
                        image.TreatmentRecordId,
                        $"/patient/treatment-records/{image.TreatmentRecordId}/images"
                    ), cancellationToken);
                }
            }
            catch (Exception ex)
            {
                // Log lỗi để debug, không throw để không ảnh hưởng luồng chính
                Console.WriteLine($"Notification send failed: {ex.Message}");
            }


            return "Xoá ảnh thành công.";
        }
    }
}
