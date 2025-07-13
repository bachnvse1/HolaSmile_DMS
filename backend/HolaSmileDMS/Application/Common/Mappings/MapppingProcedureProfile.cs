using Application.Usecases.UserCommon.ViewProcedures;
using AutoMapper;

namespace Application.Common.Mappings;

public class MapppingProcedureProfile : Profile
{
    public MapppingProcedureProfile()
    {
        CreateMap<Procedure, ViewProcedureDto>();
    }
}