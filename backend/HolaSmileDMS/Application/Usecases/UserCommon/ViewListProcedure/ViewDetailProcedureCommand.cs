using MediatR;

namespace Application.Usecases.UserCommon.ViewListProcedure
{
    public class ViewDetailProcedureCommand : IRequest<ViewProcedureDto>
    {
        public int proceduredId { get; set; }
    }
}
