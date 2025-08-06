using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceDetailsCommand : IRequest<ViewMaintenanceDetailsDto>
    {
        public int MaintenanceId { get; set; }

        public ViewMaintenanceDetailsCommand(int maintenanceId)
        {
            MaintenanceId = maintenanceId;
        }
    }
}
