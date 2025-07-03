using Application.Constants;
using System.Security.Claims;
using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Application.Usecases.UserCommon.ViewSupplies;

namespace Application.Usecases.UserCommon.ViewListProcedure;

public class ViewListProcedureHandler : IRequestHandler<ViewListProcedureCommand, List<ViewProcedureDto>>
{
    private readonly IProcedureRepository _procedureRepository;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;

    public ViewListProcedureHandler(IProcedureRepository procedureRepository,IHttpContextAccessor httpContextAccessors, IMapper mapper)
    {
        _procedureRepository = procedureRepository;
        _httpContextAccessor = httpContextAccessors;
        _mapper = mapper;
    }

    public async Task<List<ViewProcedureDto>> Handle(ViewListProcedureCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;

        var currentUserRole = user.FindFirst(ClaimTypes.Role)?.Value;
        var currentUserId = int.Parse(user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

        if (currentUserRole == null)
        {
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // "Bạn cần đăng nhập..."
        }

        var procedures = await _procedureRepository
            .GetAll()
            .Where(p => !p.IsDeleted)
            .ToListAsync(cancellationToken);
        if (!procedures.Any())
        {
            return new List<ViewProcedureDto>();
        }

        return _mapper.Map<List<ViewProcedureDto>>(procedures);
    }
}