using Application.Usecases.Dentist.ViewAllDentistSchedule;
using AutoMapper;

namespace Application.Common.Mappings
{
    public class MappingSchedule : Profile
    {
        public MappingSchedule() 
        {
            CreateMap<Schedule, ScheduleDTO>().ForMember(dest => dest.DentistName, opt => opt.MapFrom(src => src.Dentist.User.Fullname));
        }
    }
}
