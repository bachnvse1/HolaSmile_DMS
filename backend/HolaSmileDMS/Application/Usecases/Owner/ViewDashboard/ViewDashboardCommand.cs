using MediatR;

namespace Application.Usecases.Owner.ViewDashboard
{
    public class ViewDashboardCommand : IRequest<ViewDashboardDTO>
    {
        public string? Filter { get; set; }
    }
}
