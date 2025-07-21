using Application.Interfaces;
using AutoMapper;
using MediatR;

namespace Application.Usecases.Dentist.ViewListReceptionistName;

public class ViewReceptionistListHandler : IRequestHandler<ViewReceptionistListCommand, List<ReceptionistRecordDto>>
{
    private readonly IReceptionistRepository _receptionistRepository;
    private readonly IMapper _mapper;

    public ViewReceptionistListHandler(IReceptionistRepository receptionistRepository, IMapper mapper)
    {
        _receptionistRepository = receptionistRepository;
        _mapper = mapper;
    }

    public async Task<List<ReceptionistRecordDto>> Handle(ViewReceptionistListCommand request, CancellationToken cancellationToken)
    {
        var receptionists = await _receptionistRepository.GetAllReceptionistsNameAsync(cancellationToken);
        return _mapper.Map<List<ReceptionistRecordDto>>(receptionists);
    }
}