using Application.Constants;
using Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class UpdateMaintenanceStatusHandler : IRequestHandler<UpdateMaintenanceStatusCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMaintenanceRepository _maintenanceRepository;

        public UpdateMaintenanceStatusHandler(
            IHttpContextAccessor httpContextAccessor,
            IMaintenanceRepository maintenanceRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _maintenanceRepository = maintenanceRepository;
        }

        public async Task<bool> Handle(UpdateMaintenanceStatusCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            // Kiểm tra quyền receptionist
            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);
            }

            // Lấy thông tin maintenance hiện tại
            var maintenance = await _maintenanceRepository.GetMaintenanceByIdAsync(request.MaintenanceId);
            if (maintenance == null)
            {
                throw new Exception(MessageConstants.MSG.MSG04); // Không tìm thấy bảo trì
            }

            // Cập nhật trạng thái sang Approved
            maintenance.Status = "Approved";
            maintenance.UpdatedAt = DateTime.Now;
            maintenance.UpdatedBy = currentUserId;

            // Lưu thay đổi
            var updated = await _maintenanceRepository.UpdateMaintenanceAsync(maintenance);
            if (!updated)
            {
                throw new Exception(MessageConstants.MSG.MSG08); // Cập nhật thất bại
            }

            return true;
        }
    }
}