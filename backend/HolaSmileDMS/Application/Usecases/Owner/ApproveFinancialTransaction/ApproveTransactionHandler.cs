using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.SendNotification;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Owner.ApproveFinancialTransaction
{
    public class ApproveTransactionHandler : IRequestHandler<ApproveTransactionCommand, bool>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly IMediator _mediator;

        public ApproveTransactionHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor, IUserCommonRepository userCommonRepository, IMediator mediator)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
            _userCommonRepository = userCommonRepository;
            _mediator = mediator;
        }
        public async Task<bool> Handle(ApproveTransactionCommand request, CancellationToken cancellationToken)
        {
             var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }

            var exisTransaction = await _transactionRepository.GetTransactionByIdAsync(request.TransactionId);
            if (exisTransaction == null)
            {
                throw new Exception(MessageConstants.MSG.MSG127); // "Giao dịch không tồn tại"
            }

            if (exisTransaction.status != "pending")
            {
                throw new Exception(MessageConstants.MSG.MSG129); // "Giao dịch đã được phê duyệt trước đó"
            }

            exisTransaction.status = request.Action ? "approved" : "rejected";
            exisTransaction.UpdatedAt = DateTime.Now;
            exisTransaction.UpdatedBy = currentUserId;
            var isUpdated = await _transactionRepository.UpdateTransactionAsync(exisTransaction);

            try
            {
                var receptionist = await _userCommonRepository.GetByIdAsync(exisTransaction.CreatedBy, cancellationToken);

                var transactionTypeText = exisTransaction.TransactionType ? "thu" : "chi";
                await _mediator.Send(new SendNotificationCommand(
                    receptionist.UserID,
                    "Phê duyệt phiếu thu/chi",
                    $"Chủ phòng {(request.Action ? "đã phê duyệt" : "đã từ chối")} phiếu {transactionTypeText} {exisTransaction.TransactionID} vào lúc {DateTime.Now}",
                    "transaction",
                    0,
                    $"financial-transactions/{exisTransaction.TransactionID}"), cancellationToken);

            }
            catch { }

            return isUpdated;
        }
    }
}
