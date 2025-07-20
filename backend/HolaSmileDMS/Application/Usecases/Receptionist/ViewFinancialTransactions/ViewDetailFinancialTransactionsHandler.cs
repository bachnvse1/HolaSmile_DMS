using Application.Interfaces;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using MediatR;
using Application.Constants;
using Domain.Entities;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ViewDetailFinancialTransactionsHandler : IRequestHandler<ViewDetailFinancialTransactionsCommand, ViewFinancialTransactionsDTO>
    {
        private readonly IUserCommonRepository _userCommonRepository;
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ViewDetailFinancialTransactionsHandler(IUserCommonRepository userCommonRepository, ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor)
        {
            _userCommonRepository = userCommonRepository;
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<ViewFinancialTransactionsDTO> Handle(ViewDetailFinancialTransactionsCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (currentUserRole == null)
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53); // Bạn không có quyền truy cập chức năng này
            }

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            var existTransaction = await _transactionRepository.GetTransactionByIdAsync(request.TransactionId);
            if (existTransaction == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var createdByUser = await _userCommonRepository.GetByIdAsync(existTransaction.CreatedBy, cancellationToken);
            var updatedByUser = existTransaction.UpdatedBy.HasValue
                ? await _userCommonRepository.GetByIdAsync(existTransaction.UpdatedBy.Value, cancellationToken)
                : null;
            if (createdByUser == null)
            {
                throw new Exception(MessageConstants.MSG.MSG16);
            }

            var viewFinancialTransactionsDTOs = new ViewFinancialTransactionsDTO
            {
                TransactionID = existTransaction.TransactionID,
                TransactionDate = existTransaction.TransactionDate,
                TransactionType = existTransaction.TransactionType ? "Thu" : "Chi",
                Category = existTransaction.Category,
                PaymentMethod = existTransaction.PaymentMethod ? "Tiền mặt" : "Chuyển khoản",
                Amount = existTransaction.Amount,
                Description = existTransaction.Description,
                CreateAt = existTransaction.CreatedAt,
                UpdateAt = existTransaction.UpdatedAt,
                CreateBy = createdByUser.Fullname,
                UpdateBy = updatedByUser?.Fullname ?? "",
            };
            return viewFinancialTransactionsDTOs;
        }
    }
}
