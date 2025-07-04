using Application.Usecases.Dentist.CreateOrthodonticTreatmentPlan;
using AutoMapper;

namespace Application.Common.Mappings;

public class MappingCreateOrthodonticTreatmentPlan : Profile
{
    public MappingCreateOrthodonticTreatmentPlan()
    {
        CreateMap<CreateOrthodonticTreatmentPlanCommand, OrthodonticTreatmentPlan>();
    }
}