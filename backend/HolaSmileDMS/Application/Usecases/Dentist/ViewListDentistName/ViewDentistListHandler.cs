using Application.Interfaces;
using AutoMapper;
using MediatR;

namespace Application.Usecases.Dentist.ViewListDentistName;

public class ViewDentistListHandler : IRequestHandler<ViewDentistListCommand, List<DentistRecordDto>>
{
    private readonly IDentistRepository _dentistRepository;
    private readonly IMapper _mapper;

    public ViewDentistListHandler(IDentistRepository dentistRepository, IMapper mapper)
    {
        _dentistRepository = dentistRepository;
        _mapper = mapper;
    }

    public async Task<List<DentistRecordDto>> Handle(ViewDentistListCommand request, CancellationToken cancellationToken)
    {
        var dentists = await _dentistRepository.GetAllDentistsNameAsync(cancellationToken);
        return _mapper.Map<List<DentistRecordDto>>(dentists);
    }
}