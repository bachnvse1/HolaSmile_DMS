using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Application.Usecases.Receptionist.ConfigNotifyMaintenance
{
    public class CreateTransactionForMaintenanceHandler : IRequestHandler<CreateTransactionForMaintenanceCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IMaintenanceRepository _maintenanceRepository;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public CreateTransactionForMaintenanceHandler(
            IHttpContextAccessor httpContextAccessor,
            ITransactionRepository transactionRepository,
            IMaintenanceRepository maintenanceRepository,
            IOwnerRepository ownerRepository, 
            IUserCommonRepository userCommonRepository,
            IMediator mediator
            )
        {
            _httpContextAccessor = httpContextAccessor;
            _transactionRepository = transactionRepository;
            _maintenanceRepository = maintenanceRepository;
            _userCommonRepository = userCommonRepository;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }

        public async Task<bool> Handle(CreateTransactionForMaintenanceCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = user.FindFirstValue(ClaimTypes.Role);

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            if (request.MaintenanceId <= 0 || request.Price <= 0)
                throw new ArgumentException("ID bảo trì hoặc giá trị không hợp lệ.");

            var maintenance = await _maintenanceRepository.GetMaintenanceByIdWithSuppliesAsync(request.MaintenanceId);
            if (maintenance == null)
                throw new Exception("Không tìm thấy thông tin bảo trì.");

            if (!string.Equals(maintenance.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                throw new Exception("Chỉ những bảo trì đã được phê duyệt mới có thể tạo phiếu chi.");

            var transaction = new FinancialTransaction
            {
                TransactionDate = DateTime.Now,
                Description = $"Chi phí bảo trì thiết bị ngày {maintenance.MaintenanceDate:dd/MM/yyyy}",
                TransactionType = false, // False = Chi
                Category = "Chi phí bảo trì",
                PaymentMethod = true, // Tiền mặt
                Amount = Math.Round(request.Price, 2),
                status = "Approved",
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDelete = false
            };

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();
                var assistant = await _userCommonRepository.GetByIdAsync(currentUserId, cancellationToken);

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Chi phí bảo trì",
                      $"Chi phí bảo trì thiết bị ngày {maintenance.MaintenanceDate:dd/MM/yyyy}",
                      "Create", 
                      0, 
                      ""),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return await _transactionRepository.CreateTransactionAsync(transaction);
        }
    }
}
