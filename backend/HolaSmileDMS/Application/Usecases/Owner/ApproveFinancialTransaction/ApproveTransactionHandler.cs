using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
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
        private readonly IUserCommonRepository userCommonRepository;
        private readonly IMediator _mediator;

        public ApproveTransactionHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor, IUserCommonRepository userCommonRepository, IMediator mediator)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
            this.userCommonRepository = userCommonRepository;
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

            if (exisTransaction.IsConfirmed)
            {
                throw new Exception(MessageConstants.MSG.MSG129); // "Giao dịch đã được phê duyệt trước đó"
            }
            exisTransaction.IsConfirmed = true;
            exisTransaction.UpdatedAt = DateTime.Now;
            exisTransaction.UpdatedBy = currentUserId;
            var isUpdated = await _transactionRepository.UpdateTransactionAsync(exisTransaction);

            try
            {
                var receptionist = await userCommonRepository.GetByIdAsync(exisTransaction.CreatedBy, cancellationToken);

                await _mediator.Send(
                 new SendNotificationCommand(
                receptionist.UserID,
                "Tạo phiếu thu/chi",
                $"Chủ phòng đã duyệt phiếu chi {exisTransaction.Category} vào lúc {DateTime.Now}",
                "transaction", null), cancellationToken);
            }
            catch { }

            return isUpdated;
        }
    }
}
