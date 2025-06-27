using Application.Usecases.Dentist.CreateTreatmentProgress;
using Application.Usecases.Dentist.CreateTreatmentRecord;
using AutoMapper;
using Application.Usecases.Patients.ViewTreatmentProgress;

namespace Application.Common.Mappings;

public class MappingTreatmentProgress : Profile
{
    public MappingTreatmentProgress()
    {
        CreateMap<TreatmentProgress, ViewTreatmentProgressDto>()
            .ForMember(dest => dest.DentistName,
                opt => opt.MapFrom(src => src.Dentist != null ? src.Dentist.User.Fullname : null))
            .ForMember(dest => dest.PatientName,
                opt => opt.MapFrom(src => src.Patient != null ? src.Patient.User.Fullname : null))
            .ForMember(dest => dest.CreatedBy,
                opt => opt.MapFrom(src => src.Dentist != null ? src.Dentist.User.Fullname : null))
            .ForMember(dest => dest.UpdatedBy,
                opt => opt.MapFrom(src => src.Dentist != null ? src.Dentist.User.Fullname : null));
        CreateMap<CreateTreatmentRecordCommand, TreatmentRecord>()
            .ForMember(dest => dest.TreatmentRecordID, opt => opt.Ignore());
        CreateMap<CreateTreatmentProgressDto, TreatmentProgress>();
    }
}