using Application.Constants;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.DeactivePrescriptionTemplate
{
    public class DeactivePrescriptionTemplateHandler : IRequestHandler<DeactivePrescriptionTemplateCommand, string>
    {
        private readonly IPrescriptionTemplateRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeactivePrescriptionTemplateHandler(IPrescriptionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(DeactivePrescriptionTemplateCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

            var template = await _repository.GetByIdAsync(request.PreTemplateID, cancellationToken);
            if (template == null || template.IsDeleted)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG110); // Không tìm thấy

            template.IsDeleted = true;
            template.UpdatedAt = DateTime.Now;

            var result = await _repository.UpdateAsync(template, cancellationToken);

            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // Lỗi hệ thống

            return MessageConstants.MSG.MSG112; // Hủy kích hoạt mẫu đơn thuốc thành công
        }
    }
}
