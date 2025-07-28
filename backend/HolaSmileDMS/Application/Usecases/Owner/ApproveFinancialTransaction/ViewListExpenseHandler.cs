using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Owner.ApproveFinancialTransaction
{
    public class ViewListExpenseHandler : IRequestHandler<ViewListExpenseCommand, List<ViewFinancialTransactionsDTO>>
    {
        private readonly ITransactionRepository _transactionRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public ViewListExpenseHandler(ITransactionRepository transactionRepository, IHttpContextAccessor httpContextAccessor)
        {
            _transactionRepository = transactionRepository;
            _httpContextAccessor = httpContextAccessor;
        }
        public async Task<List<ViewFinancialTransactionsDTO>> Handle(ViewListExpenseCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var currentUserRole = user?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.Equals(currentUserRole, "receptionist", StringComparison.OrdinalIgnoreCase) && !string.Equals(currentUserRole, "owner", StringComparison.OrdinalIgnoreCase))
            {
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26); // "Bạn không có quyền truy cập chức năng này"
            }
            var transactions = await _transactionRepository.GetExpenseTransactionsAsync();
            if (transactions == null || !transactions.Any())
            {
                transactions = new List<FinancialTransaction>();
            }
            var viewFinancialTransactionsDTOs = transactions.Select(x => new ViewFinancialTransactionsDTO
            {
                TransactionID = x.TransactionID,
                TransactionDate = x.TransactionDate,
                TransactionType = x.TransactionType ? "Thu" : "Chi",
                Category = x.Category,
                PaymentMethod = x.PaymentMethod ? "Tiền mặt" : "Chuyển khoản",
                Amount = x.Amount,
                Description = x.Description,
                Status = x.status,
            }).ToList();
            return viewFinancialTransactionsDTOs;
        }
    }
}
