using AutoMapper;
using HDMS_API.Application.Usecases.Guests.BookAppointment;
using HDMS_API.Application.Usecases.Receptionist.CreatePatientAccount;

namespace HDMS_API.Application.Common.Mappings
{
    public class MappingCreatePatient : Profile
    {
        public MappingCreatePatient()
        {
            CreateMap<CreatePatientCommand, CreatePatientDto>();
            CreateMap<BookAppointmentCommand, CreatePatientDto>();
        }
    }
}
