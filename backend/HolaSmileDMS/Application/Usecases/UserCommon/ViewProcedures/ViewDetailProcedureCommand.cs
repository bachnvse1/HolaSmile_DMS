using MediatR;

namespace Application.Usecases.UserCommon.ViewProcedures
{
    public class ViewDetailProcedureCommand : IRequest<ViewProcedureDto>
    {
        public int proceduredId { get; set; }
    }
}
