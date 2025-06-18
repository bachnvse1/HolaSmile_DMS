using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.UserCommon.Appointment
{
    public class ViewApponintmentHandler : IRequestHandler<ViewAppointmentCommand, List<AppointmentDTO>>
    {

        public Task<List<AppointmentDTO>> Handle(ViewAppointmentCommand request, CancellationToken cancellationToken)
        {
            throw new NotImplementedException();
        }
    }
}
