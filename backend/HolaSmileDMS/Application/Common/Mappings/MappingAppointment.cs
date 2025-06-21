using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.Services;
using Application.Usecases.UserCommon.ViewAppointment;
using AutoMapper;

namespace Application.Common.Mappings
{
    public class MappingAppointment : Profile
    {
        public MappingAppointment() 
        {
            CreateMap<Appointment,AppointmentDTO>()
            .ForMember(dest => dest.PatientName,
                opt => opt.MapFrom(src => src.Patient.User.Fullname))
            .ForMember(dest => dest.DentistName,
                opt => opt.MapFrom(src => src.Dentist.User.Fullname));
        }
    }
}
