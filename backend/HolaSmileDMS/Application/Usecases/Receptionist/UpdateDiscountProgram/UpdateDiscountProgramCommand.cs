using Application.Usecases.Receptionist.CreateDiscountProgram;
using MediatR;

namespace Application.Usecases.Receptionist.UpdateDiscountProgram
{
    public class UpdateDiscountProgramCommand : IRequest<bool>
    {
        public int ProgramId { get; set; }
        public string ProgramName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal DiscountPercentage { get; set; }
        public List<ProcedureDiscountProgramDTO> ListProcedure { get; set; } = new List<ProcedureDiscountProgramDTO>();

    }
}
