using System.Security.Claims;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.ViewInstructionTemplateList;

public class ViewInstructionTemplateListHandler : IRequestHandler<ViewInstructionTemplateListQuery, List<ViewInstructionTemplateDto>>
{
    private readonly IInstructionTemplateRepository _repository;
    private readonly IUserCommonRepository _userCommonRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewInstructionTemplateListHandler(
        IInstructionTemplateRepository repository,
        IHttpContextAccessor httpContextAccessor,
        IUserCommonRepository userCommonRepository)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
        _userCommonRepository = userCommonRepository;
    }

    public async Task<List<ViewInstructionTemplateDto>> Handle(ViewInstructionTemplateListQuery request, CancellationToken cancellationToken)
    {
        // Optional: Check user role
        var user = _httpContextAccessor.HttpContext?.User;
        var list = await _repository.GetAllAsync();
        var result = new List<ViewInstructionTemplateDto>();

        foreach (var x in list.Where(x => !x.IsDeleted))
        {
            var createByUser = await _userCommonRepository.GetByIdAsync(x.CreateBy, cancellationToken);
            var updateByUser = x.UpdatedBy.HasValue
                ? await _userCommonRepository.GetByIdAsync(x.UpdatedBy.Value, cancellationToken)
                : null;

            result.Add(new ViewInstructionTemplateDto
            {
                Instruc_TemplateID = x.Instruc_TemplateID,
                Instruc_TemplateName = x.Instruc_TemplateName,
                Instruc_TemplateContext = x.Instruc_TemplateContext,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt ?? default,
                CreateByName = createByUser?.Fullname ?? "N/A",
                UpdateByName = updateByUser?.Fullname ?? "N/A"
            });
        }

        return result;
    }
}