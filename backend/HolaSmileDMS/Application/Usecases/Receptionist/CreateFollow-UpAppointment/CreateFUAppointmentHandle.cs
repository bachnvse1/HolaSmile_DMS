using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Receptionist.CreateFollow_UpAppointment
{
    public class CreateFUAppointmentHandle : IRequestHandler<CreateFUAppointmentCommand, string>
    {
        public CreateFUAppointmentHandle() { }
        public async Task<string> Handle(CreateFUAppointmentCommand request, CancellationToken cancellationToken)
        {
            // Here you would typically interact with a repository to save the appointment details
            // For now, we will just return a success message
            if (string.IsNullOrEmpty(request.PatientId) || string.IsNullOrEmpty(request.DoctorId))
            {
                return "Patient ID and Doctor ID are required.";
            }
            // Simulate saving the appointment
            await Task.Delay(100); // Simulating async operation
            return "Follow-up appointment created successfully.";
        }
    }
}
