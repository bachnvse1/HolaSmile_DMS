using MediatR;

namespace Application.Usecases.Dentist.ManageSchedule
{
    public class CreateScheduleCommand : IRequest<string>
    {
       public List<CreateScheduleDTO> RegisSchedules { get; set; } = new List<CreateScheduleDTO>();
        public CreateScheduleCommand() { }
        public CreateScheduleCommand(List<CreateScheduleDTO> regisSchedules)
        {
            RegisSchedules = regisSchedules;
        }
    }
}
