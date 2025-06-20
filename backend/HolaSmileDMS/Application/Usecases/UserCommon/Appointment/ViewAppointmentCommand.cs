using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.UserCommon.Appointment
{
    public class ViewAppointmentCommand : IRequest<List<AppointmentDTO>>
    {
    }
}
