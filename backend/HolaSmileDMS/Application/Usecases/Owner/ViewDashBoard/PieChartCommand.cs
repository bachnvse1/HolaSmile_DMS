using MediatR;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class PieChartCommand : IRequest<PieChartDto>
    {
        public string? Filter { get; set; }
        public PieChartCommand(string filter)
        {
            Filter = filter;
        }
    }
    }
