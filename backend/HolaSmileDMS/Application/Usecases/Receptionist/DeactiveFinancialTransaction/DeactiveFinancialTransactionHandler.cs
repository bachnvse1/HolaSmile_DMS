using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Receptionist.DeactiveFinancialTransaction
{
    public class DeactiveFinancialTransactionHandler : IRequestHandler<DeactiveFinancialTransactionCommand, bool>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IOwnerRepository _ownerRepository;
        private readonly IMediator _mediator;

        public DeactiveFinancialTransactionHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor, IOwnerRepository ownerRepository, IMediator mediator)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
            _ownerRepository = ownerRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(DeactiveFinancialTransactionCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            var existingTransaction = await _transactionRepository.GetTransactionByIdAsync(request.TransactionId);
            if (existingTransaction == null)
            {
                throw new Exception(MessageConstants.MSG.MSG127);
            }
            existingTransaction.IsDelete = !existingTransaction.IsDelete;
            existingTransaction.UpdatedAt = DateTime.Now;
            existingTransaction.UpdatedBy = currentUserId;
            var isUpdated = await _transactionRepository.UpdateTransactionAsync(existingTransaction);

            try
            {
                var owners = await _ownerRepository.GetAllOwnersAsync();

                var notifyOwners = owners.Select(async o =>
                await _mediator.Send(
                 new SendNotificationCommand(
                o.User.UserID,
                "Chỉnh sửa phiếu thu/chi",
                $"Lễ tân {o.User.Fullname} đã xóa phiếu {(existingTransaction.TransactionType ? "thu" : "chi")} vào lúc {DateTime.Now}",
                "transaction", 0, $"financial-transactions"), cancellationToken));
                await System.Threading.Tasks.Task.WhenAll(notifyOwners);
            }
            catch { }

            return isUpdated;
        }
    }
}
