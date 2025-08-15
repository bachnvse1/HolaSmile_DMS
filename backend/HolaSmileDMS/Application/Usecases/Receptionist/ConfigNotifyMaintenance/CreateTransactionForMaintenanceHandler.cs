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

            // Check if maintenance already has a price
            if (maintenance.Price > 0)
                throw new Exception($"Đã tồn tại giao dịch chi phí bảo trì cho ngày {maintenance.MaintenanceDate:dd/MM/yyyy}");

            if (!string.Equals(maintenance.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                throw new Exception("Chỉ những bảo trì đã được phê duyệt mới có thể tạo phiếu chi.");

  
            // Update maintenance price
            maintenance.Price = (int)request.Price;
            maintenance.UpdatedAt = DateTime.Now;
            maintenance.UpdatedBy = currentUserId;

            var updateSuccess = await _maintenanceRepository.UpdateMaintenanceAsync(maintenance);
            if (!updateSuccess)
                throw new Exception("Cập nhật giá bảo trì thất bại.");

            var transaction = new FinancialTransaction
            {
                TransactionDate = maintenance.MaintenanceDate,
                Description = $"Chi phí bảo trì thiết bị ngày {maintenance.MaintenanceDate:dd/MM/yyyy}",
                TransactionType = false,
                Category = "Chi phí bảo trì",
                PaymentMethod = true,
                Amount = Math.Round(request.Price, 2),
                status = "pending",
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDelete = false
            };

            var transactionCreated = await _transactionRepository.CreateTransactionAsync(transaction);
            if (!transactionCreated)
                throw new Exception("Tạo phiếu chi thất bại");

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(new SendNotificationCommand(
                      o.User.UserID,
                      "Chi phí bảo trì",
                      $"Chi phí bảo trì thiết bị ngày {maintenance.MaintenanceDate:dd/MM/yyyy}",
                      "Create",
                      transaction.TransactionID,
                      $"/financial-transactions/{transaction.TransactionID}"),
                cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return true;
        }
    }
}
