using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.DeactivePatientDentalImage
{
    public class DeactivePatientDentalImageHandler : IRequestHandler<DeactivePatientDentalImageCommand, string>
    {
        private readonly IImageRepository _imageRepo;
        private readonly IHttpContextAccessor _httpContext;

        public DeactivePatientDentalImageHandler(IImageRepository imageRepo, IHttpContextAccessor httpContext)
        {
            _imageRepo = imageRepo;
            _httpContext = httpContext;
        }

        public async Task<string> Handle(DeactivePatientDentalImageCommand request, CancellationToken cancellationToken)
        {
            var role = _httpContext.HttpContext?.User.FindFirst(ClaimTypes.Role)?.Value;
            if (role != "Assistant" && role != "Dentist")
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

            return "Xoá ảnh thành công.";
        }
    }
}
