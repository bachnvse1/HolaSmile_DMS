using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Patients.CancelAppointment
{
    public class CancleAppointmentCommand : IRequest<string>
    {
        public string AppointmentId { get; set; }
    }
}
