using Application.Usecases.Patients.ViewTreatmentRecord;
using AutoMapper;

namespace HDMS_API.Application.Common.Mappings;

public class MappingViewTreatmentRecord : Profile
{
    public MappingViewTreatmentRecord()
    {
        CreateMap<TreatmentRecord, ViewTreatmentRecordDto>()
            .ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist.User.Fullname))
            .ForMember(dest => dest.ProcedureName, opt => opt.MapFrom(src => src.Procedure.ProcedureName))
            .ForMember(dest => dest.AppointmentDate, opt => opt.MapFrom(src => src.Appointment.AppointmentDate))
            .ForMember(dest => dest.AppointmentTime, opt => opt.MapFrom(src => src.Appointment.AppointmentTime))
            .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.Dentist.User.Fullname))
            .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.Dentist.User.Fullname));
    }
}