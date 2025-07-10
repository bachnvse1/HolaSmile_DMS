using Application.Constants;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.Threading.Tasks;


namespace Application.Usecases.Assistants.UpdatePrescriptionTemplate
{
    public class UpdatePrescriptionTemplateHandler : IRequestHandler<UpdatePrescriptionTemplateCommand, string>
    {
        private readonly IPrescriptionTemplateRepository _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UpdatePrescriptionTemplateHandler(IPrescriptionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> Handle(UpdatePrescriptionTemplateCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var role = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (user == null || role != "Assistant")
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"

            var existing = await _repository.GetByIdAsync(request.PreTemplateID, cancellationToken);
            if (existing == null || existing.IsDeleted)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG110); // "Không tìm thấy dữ liệu"

            existing.PreTemplateName = request.PreTemplateName;
            existing.PreTemplateContext = request.PreTemplateContext;
            existing.UpdatedAt = DateTime.UtcNow;

            var success = await _repository.UpdateAsync(existing, cancellationToken);
            if (!success)
                throw new Exception(MessageConstants.MSG.MSG58);

            return MessageConstants.MSG.MSG109;
        }
    }
}
