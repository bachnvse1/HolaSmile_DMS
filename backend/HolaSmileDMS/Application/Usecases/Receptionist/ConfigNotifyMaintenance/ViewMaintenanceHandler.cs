using Application.Interfaces;
using MediatR;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceHandler : IRequestHandler<ViewMaintenanceCommand, List<ViewMaintenanceDto>>
    {
        private readonly IMaintenanceRepository _maintenanceRepository;

        public ViewMaintenanceHandler(IMaintenanceRepository maintenanceRepository)
        {
            _maintenanceRepository = maintenanceRepository;
        }

        public async Task<List<ViewMaintenanceDto>> Handle(ViewMaintenanceCommand request, CancellationToken cancellationToken)
        {
            var maintenances = await _maintenanceRepository.GetAllMaintenancesWithSuppliesAsync();

            return maintenances.Select(m => new ViewMaintenanceDto
            {
                MaintenanceId = m.MaintenanceId,
                MaintenanceDate = m.MaintenanceDate,
                Description = m.Description,
                Status = m.Status,
                Price = m.Price,
                Supplies = m.MaintenanceSupplies
                              .Select(ms => ms.Supplies?.Name ?? "(Không xác định)")
                              .ToList()
            }).ToList();
        }
    }
}
