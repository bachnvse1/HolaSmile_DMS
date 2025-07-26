using Application.Constants;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Assistants.CreatePrescriptionTemplate
{
    public class CreatePrescriptionTemplateHandler : IRequestHandler<CreatePrescriptionTemplateCommand, string>
    {
        private readonly IPrescriptionTemplateRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CreatePrescriptionTemplateHandler(IPrescriptionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(CreatePrescriptionTemplateCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || role != "Assistant" && role != "Dentist")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            var newTemplate = new PrescriptionTemplate
            {
                PreTemplateName = request.PreTemplateName,
                PreTemplateContext = request.PreTemplateContext,
                CreatedAt = DateTime.Now,
                IsDeleted = false
            };

            var result = await _repository.CreateAsync(newTemplate, cancellationToken);

            if (!result)
                throw new Exception(MessageConstants.MSG.MSG58); // "Có lỗi xảy ra"

            return MessageConstants.MSG.MSG111; // "Tạo mẫu đơn thuốc thành công"
        }
    }
}
