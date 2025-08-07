using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class ViewMaintenanceDetailsHandler : IRequestHandler<ViewMaintenanceDetailsCommand, ViewMaintenanceDetailsDto>
    {
        private readonly IMaintenanceRepository _maintenanceRepo;

        public ViewMaintenanceDetailsHandler(IMaintenanceRepository maintenanceRepo)
        {
            _maintenanceRepo = maintenanceRepo;
        }

        public async Task<ViewMaintenanceDetailsDto> Handle(ViewMaintenanceDetailsCommand request, CancellationToken cancellationToken)
        {
            var maintenance = await _maintenanceRepo.GetMaintenanceByIdWithSuppliesAsync(request.MaintenanceId);

            if (maintenance == null || maintenance.IsDeleted)
                throw new KeyNotFoundException("Không tìm thấy thông tin bảo trì.");

            var dto = new ViewMaintenanceDetailsDto
            {
                MaintenanceId = maintenance.MaintenanceId,
                MaintenanceDate = maintenance.MaintenanceDate,
                Description = maintenance.Description,
                Status = maintenance.Status,
                Price = maintenance.Price,
                Supplies = maintenance.MaintenanceSupplies.Select(ms => new SupplyDto
                {
                    SupplyId = ms.SupplyId,
                    Name = ms.Supplies.Name,
                    Unit = ms.Supplies.Unit,
                    Price = ms.Supplies.Price,
                    ExpiryDate = ms.Supplies.ExpiryDate
                }).ToList()
            };

            return dto;
        }
    }
}
