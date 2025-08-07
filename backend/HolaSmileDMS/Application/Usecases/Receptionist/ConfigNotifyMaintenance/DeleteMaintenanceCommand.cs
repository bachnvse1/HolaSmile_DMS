using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class DeleteMaintenanceCommand : IRequest<bool>
    {
        public int MaintenanceId { get; set; }

        public DeleteMaintenanceCommand(int maintenanceId)
        {
            MaintenanceId = maintenanceId;
        }
    }
}
