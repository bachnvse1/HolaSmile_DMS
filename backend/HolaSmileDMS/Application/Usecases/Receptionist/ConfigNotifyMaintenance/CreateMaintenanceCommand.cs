using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class CreateMaintenanceCommand : IRequest<bool>
    {
        public DateTime MaintenanceDate { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public List<int> SupplyIds { get; set; } = new();
    }
}
