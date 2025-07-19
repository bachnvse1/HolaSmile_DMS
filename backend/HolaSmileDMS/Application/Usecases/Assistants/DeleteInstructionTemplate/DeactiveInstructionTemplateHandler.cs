using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.DeleteInstructionTemplate;

public class DeactiveInstructionTemplateHandler : IRequestHandler<DeactiveInstructionTemplateCommand, string>
{
    private readonly IInstructionTemplateRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public DeactiveInstructionTemplateHandler(IInstructionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> Handle(DeactiveInstructionTemplateCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (role != "Assistant") throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var template = await _repository.GetByIdAsync(request.Instruc_TemplateID);
        if (template == null || template.IsDeleted)
            throw new Exception(MessageConstants.MSG.MSG115); // Mẫu chỉ dẫn không tồn tại

        template.IsDeleted = true;
        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = currentUserId;
        await _repository.UpdateAsync(template);
        return MessageConstants.MSG.MSG105; // Vô hiệu hoá thẻ bảo hành thành công (dùng lại MSG105)
    }
}