using Application.Constants;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class CreateMaintenanceHandler : IRequestHandler<CreateMaintenanceCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMaintenanceRepository _maintenanceRepository;
        private readonly ISupplyRepository _supplyRepository;

        public CreateMaintenanceHandler(
            IHttpContextAccessor httpContextAccessor,
            IMaintenanceRepository maintenanceRepository,
            ISupplyRepository supplyRepository)
        {
            _httpContextAccessor = httpContextAccessor;
            _maintenanceRepository = maintenanceRepository;
            _supplyRepository = supplyRepository;
        }

        public async Task<bool> Handle(CreateMaintenanceCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // Không có quyền
            }

            if (request.MaintenanceDate == default)
            {
                throw new Exception(MessageConstants.MSG.MSG07); // Ngày bảo trì không hợp lệ
            }

            if (request.SupplyIds == null || !request.SupplyIds.Any())
            {
                throw new Exception(MessageConstants.MSG.MSG99); // Danh sách supplies không được trống
            }

            var maintenance = new EquipmentMaintenance
            {
                MaintenanceDate = request.MaintenanceDate,
                Description = request.Description,
                Status = request.Status,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false,
                Price = 0 // Không xử lý Price ở đây
            };

            // Lưu maintenance
            var created = await _maintenanceRepository.CreateMaintenanceAsync(maintenance);
            if (!created) throw new Exception(MessageConstants.MSG.MSG116);

            // Thêm các MaintenanceSupply
            foreach (var supplyId in request.SupplyIds)
            {
                var supply = await _supplyRepository.GetSupplyBySupplyIdAsync(supplyId);
                if (supply == null)
                    throw new Exception($"Supply ID {supplyId} không tồn tại");

                var maintenanceSupply = new MaintenanceSupply
                {
                    MaintenanceId = maintenance.MaintenanceId,
                    SupplyId = supplyId
                };

                await _maintenanceRepository.CreateMaintenanceSupplyAsync(maintenanceSupply);
            }

            return true;
        }
    }
}
