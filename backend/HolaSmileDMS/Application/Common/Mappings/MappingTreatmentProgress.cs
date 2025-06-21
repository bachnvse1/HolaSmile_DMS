using AutoMapper;
using Application.Usecases.Patients.ViewTreatmentProgress;

namespace Application.Common.Mappings;

public class MappingTreatmentProgress : Profile
{
    public MappingTreatmentProgress()
    {
        CreateMap<TreatmentProgress, ViewTreatmentProgressDto>()
            .ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist != null ? src.Dentist.User.Fullname : null))
            .ForMember(dest => dest.PatientName, opt => opt.MapFrom(src => src.Patient != null ? src.Patient.User.Fullname : null));
    }
}