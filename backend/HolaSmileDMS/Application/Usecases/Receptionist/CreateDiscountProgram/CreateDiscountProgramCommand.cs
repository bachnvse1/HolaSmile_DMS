using Domain.Entities;
using MediatR;

namespace Application.Usecases.Receptionist.CreateDiscountProgram
{
    public class CreateDiscountProgramCommand : IRequest<bool>
    {
        public string ProgramName { get; set; } = string.Empty;
        public DateTime CreateDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<ProcedureDiscountProgramDTO> ListProcedure { get; set; } = new List<ProcedureDiscountProgramDTO>();
    }
}
