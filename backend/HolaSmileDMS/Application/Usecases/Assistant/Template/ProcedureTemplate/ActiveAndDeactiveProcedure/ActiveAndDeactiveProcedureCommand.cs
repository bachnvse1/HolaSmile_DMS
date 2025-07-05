using MediatR;

namespace Application.Usecases.Assistant.Template.ProcedureTemplate.ActiveAndDeactiveProcedure
{
    public class ActiveAndDeactiveProcedureCommand : IRequest<bool>
    {
        public int ProcedureId { get; set; }
    }
}
