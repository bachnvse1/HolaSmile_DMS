using Application.Usecases.UserCommon.ViewProcedures;
using AutoMapper;

namespace Application.Common.Mappings;

public class MapppingProcedure : Profile
{
    public MapppingProcedure()
    {
        CreateMap<Procedure, ViewProcedureDto>()
            .ForMember(dest => dest.SuppliesUsed,
                opt => opt.MapFrom(src => src.SuppliesUsed));

                CreateMap<SuppliesUsed, ViewSuppliesUsedDto>()
            .ForMember(dest => dest.SupplyName, opt => opt.MapFrom(src => src.Supplies.Name))
            .ForMember(dest => dest.Unit, opt => opt.MapFrom(src => src.Supplies.Unit))
            .ForMember(dest => dest.Quantity, opt => opt.MapFrom(src => src.Quantity));
    }
}