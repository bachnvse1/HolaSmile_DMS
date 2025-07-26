using MediatR;

namespace Application.Usecases.Dentists.CreatInstruction
{
    public class CreateInstructionCommand : IRequest<string>
    {
        public int AppointmentId { get; set; }
        public int? Instruc_TemplateID { get; set; }
        public string? Content { get; set; }
    }
}
