using MediatR;

namespace Application.Usecases.Owner.ViewDashBoard
{
    public class PieChartCommand : IRequest<PieChartDto>
    {
        // Chỉ cần lấy tháng hiện tại
    }
}
