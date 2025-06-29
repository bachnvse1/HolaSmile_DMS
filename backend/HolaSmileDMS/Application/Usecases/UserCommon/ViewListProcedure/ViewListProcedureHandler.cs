using Application.Interfaces;
using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Usecases.UserCommon.ViewListProcedure;

public class ViewListProcedureHandler : IRequestHandler<ViewListProcedureCommand, List<ViewProcedureDto>>
{
    private readonly IProcedureRepository _procedureRepository;
    private readonly IMapper _mapper;

    public ViewListProcedureHandler(IProcedureRepository procedureRepository, IMapper mapper)
    {
        _procedureRepository = procedureRepository;
        _mapper = mapper;
    }

    public async Task<List<ViewProcedureDto>> Handle(ViewListProcedureCommand request, CancellationToken cancellationToken)
    {
        var procedures = await _procedureRepository
            .GetAll()
            .Where(p => !p.IsDeleted)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<ViewProcedureDto>>(procedures);
    }
}