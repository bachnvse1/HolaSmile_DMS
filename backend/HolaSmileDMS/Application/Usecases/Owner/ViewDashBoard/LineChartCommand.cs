using MediatR;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class LineChartCommand : IRequest<LineChartDto>
    {
        public string? Filter { get; set; } // Optional filter for the chart, e.g., "today", "week", "month", "year"
        // You can add more properties if needed for the command
        public LineChartCommand(string? filter)
        {
            Filter = filter;

        }
    }
}
