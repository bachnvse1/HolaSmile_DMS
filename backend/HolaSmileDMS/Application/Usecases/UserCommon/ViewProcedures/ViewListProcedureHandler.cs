using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.UserCommon.ViewProcedures;

public class ViewListProcedureHandler : IRequestHandler<ViewListProcedureCommand, List<ViewProcedureDto>>
{
    private readonly IProcedureRepository _procedureRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;

    public ViewListProcedureHandler(
        IProcedureRepository procedureRepository,
        IHttpContextAccessor httpContextAccessor,
        IMapper mapper)
    {
        _procedureRepository = procedureRepository;
        _httpContextAccessor = httpContextAccessor;
        _mapper = mapper;
    }

    public async Task<List<ViewProcedureDto>> Handle(ViewListProcedureCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;

        var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        var allProcedures = await _procedureRepository.GetAll(); // Repository trả về List<Procedure>

        var listProcedures = string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase)
            ? allProcedures
            : allProcedures.Where(p => !p.IsDeleted).ToList();

        listProcedures = listProcedures?.ToList() ?? new List<Procedure>();

        return _mapper.Map<List<ViewProcedureDto>>(listProcedures) ?? new List<ViewProcedureDto>();
    }
}