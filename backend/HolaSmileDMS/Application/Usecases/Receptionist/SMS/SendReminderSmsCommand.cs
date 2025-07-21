using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Receptionist.SMS
{
    public class SendReminderSmsCommand : IRequest<bool>
    {
        public string PhoneNumber { get; set; }
        public string Message { get; set; }
        //public DateTime AppointmentDate { get; set; }
        //public TimeOnly AppointmentTime { get; set; }

    }
}
