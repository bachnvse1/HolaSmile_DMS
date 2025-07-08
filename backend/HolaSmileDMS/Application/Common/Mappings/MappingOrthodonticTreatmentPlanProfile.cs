using Application.Usecases.Dentist.CreateOrthodonticTreatmentPlan;
using Application.Usecases.Dentist.UpdateOrthodonticTreatmentPlan;
using Application.Usecases.Patients.ViewOrthodonticTreatmentPlan;
using AutoMapper;

namespace Application.Common.Mappings;

public class OrthodonticTreatmentPlanProfile : Profile
{
    public OrthodonticTreatmentPlanProfile()
    {
        CreateMap<OrthodonticTreatmentPlan, OrthodonticTreatmentPlanDto>()
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient.User.Fullname))
            .ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist.User.Fullname))
            .ForMember(dest => dest.CreatedByName, opt => opt.Ignore()) // bổ sung thủ công trong repo
            .ForMember(dest => dest.UpdatedByName, opt => opt.Ignore());
        CreateMap<EditOrthodonticTreatmentPlanDto, OrthodonticTreatmentPlan>()
            .ForMember(dest => dest.PlanId, opt => opt.Ignore()) // vì không update ID
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.PatientId, opt => opt.Ignore()) // không cho update các FK quan trọng
            .ForMember(dest => dest.DentistId, opt => opt.Ignore());
        CreateMap<CreateOrthodonticTreatmentPlanCommand, OrthodonticTreatmentPlan>();
    }
}