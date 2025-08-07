using Application.Constants;
using Application.Interfaces;
using MediatR;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class DeleteMaintenanceHandler : IRequestHandler<DeleteMaintenanceCommand, bool>
    {
        private readonly IMaintenanceRepository _maintenanceRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DeleteMaintenanceHandler(IMaintenanceRepository maintenanceRepository, IHttpContextAccessor httpContextAccessor)
        {
            _maintenanceRepository = maintenanceRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<bool> Handle(DeleteMaintenanceCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirstValue(ClaimTypes.Role);

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            var maintenance = await _maintenanceRepository.GetMaintenanceByIdAsync(request.MaintenanceId);
            if (maintenance == null || maintenance.IsDeleted)
                throw new KeyNotFoundException(MessageConstants.MSG.MSG06);

            maintenance.IsDeleted = true;
            maintenance.UpdatedAt = DateTime.Now;
            maintenance.UpdatedBy = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

            return await _maintenanceRepository.UpdateMaintenanceAsync(maintenance);
        }
    }
}
