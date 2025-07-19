using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.EditInstructionTemplate;

public class EditInstructionTemplateHandler : IRequestHandler<EditInstructionTemplateCommand, string>
{
    private readonly IInstructionTemplateRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EditInstructionTemplateHandler(IInstructionTemplateRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> Handle(EditInstructionTemplateCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (role != "Assistant") throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var template = await _repository.GetByIdAsync(request.Instruc_TemplateID);
        if (template == null || template.IsDeleted)
            throw new Exception(MessageConstants.MSG.MSG115); // Mẫu chỉ dẫn không tồn tại

        template.Instruc_TemplateName = request.Instruc_TemplateName;
        template.Instruc_TemplateContext = request.Instruc_TemplateContext;
        template.UpdatedAt = DateTime.UtcNow;
        template.UpdatedBy = currentUserId;
        await _repository.UpdateAsync(template);
        return MessageConstants.MSG.MSG107; // Cập nhật thành công
    }
}