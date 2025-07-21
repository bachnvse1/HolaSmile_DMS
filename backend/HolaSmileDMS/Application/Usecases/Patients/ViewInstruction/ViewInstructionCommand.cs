using MediatR;
using System.Collections.Generic;

namespace Application.Usecases.Patients.ViewInstruction
{
    public class ViewInstructionCommand : IRequest<List<ViewInstructionDto>>
    {
        public int? AppointmentId { get; set; }

        public ViewInstructionCommand(int? appointmentId = null)
        {
            AppointmentId = appointmentId;
        }
    }
}
