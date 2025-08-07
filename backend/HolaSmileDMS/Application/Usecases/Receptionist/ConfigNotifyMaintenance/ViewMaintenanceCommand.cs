using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceCommand : IRequest<List<ViewMaintenanceDto>>
    {
        // Bạn có thể thêm filter sau nếu cần, ví dụ theo ngày hoặc status
    }
}
