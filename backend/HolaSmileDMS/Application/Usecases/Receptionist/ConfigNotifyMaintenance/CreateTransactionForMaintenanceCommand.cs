using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class CreateTransactionForMaintenanceCommand : IRequest<bool>
    {
        public int MaintenanceId { get; set; }
        public decimal Price { get; set; }
    }
}
