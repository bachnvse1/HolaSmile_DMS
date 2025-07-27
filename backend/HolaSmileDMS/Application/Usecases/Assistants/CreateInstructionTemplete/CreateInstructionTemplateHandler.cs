using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.CreateInstructionTemplete;

public class CreateInstructionTemplateHandler : IRequestHandler<CreateInstructionTemplateCommand, string>
{
    private readonly IInstructionTemplateRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CreateInstructionTemplateHandler(
        IInstructionTemplateRepository repository,
        IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<string> Handle(CreateInstructionTemplateCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (role != "Assistant" && role != "Dentist")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền

        if (string.IsNullOrWhiteSpace(request.Instruc_TemplateName) ||
            string.IsNullOrWhiteSpace(request.Instruc_TemplateContext))
        {
            throw new ArgumentException(MessageConstants.MSG.MSG07); // Vui lòng nhập thông tin bắt buộc
        }

        var entity = new InstructionTemplate
        {
            Instruc_TemplateName = request.Instruc_TemplateName,
            Instruc_TemplateContext = request.Instruc_TemplateContext,
            CreatedAt = DateTime.UtcNow,
            CreateBy = currentUserId,
            IsDeleted = false
        };

        await _repository.CreateAsync(entity);
        return MessageConstants.MSG.MSG114; // Tạo chỉ dẫn thành công
    }
}