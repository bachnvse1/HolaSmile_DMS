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
    }
}