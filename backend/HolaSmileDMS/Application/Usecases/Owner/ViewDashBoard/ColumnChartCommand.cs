using MediatR;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class ColumnChartCommand : IRequest<ColumnChartDto>
    {
        public string? Filter { get; set; }
    }
}
