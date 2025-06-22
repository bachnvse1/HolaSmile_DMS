using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Receptionist.CreateFollow_UpAppointment
{
    public class CreateFUAppointmentCommand : IRequest<string>
    {
        public string PatientId { get; set; }
        public string DoctorId { get; set; }
        public DateTime AppointmentDate { get; set; }
        public TimeSpan AppointmentTime { get; set; }
        public string ReasonForFollowUp { get; set; }
    }
}
