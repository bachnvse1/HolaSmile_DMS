using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.UserCommon.ViewAppointment
{
    public class ViewDetailAppointmentCommand : IRequest<AppointmentDTO>
    {
        public int AppointmentId { get; set; }
    }
}
