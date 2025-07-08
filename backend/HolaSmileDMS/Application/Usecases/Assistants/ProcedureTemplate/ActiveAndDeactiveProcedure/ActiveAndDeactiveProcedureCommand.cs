using MediatR;

namespace Application.Usecases.Assistant.ProcedureTemplate.ActiveAndDeactiveProcedure
{
    public class ActiveAndDeactiveProcedureCommand : IRequest<bool>
    {
        public int ProcedureId { get; set; }
    }
}
