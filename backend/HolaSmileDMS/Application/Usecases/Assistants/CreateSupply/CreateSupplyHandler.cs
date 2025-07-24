using System.Security.Claims;
using Application.Constants;
using Application.Interfaces;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class CreateSupplyHandler : IRequestHandler<CreateSupplyCommand, bool>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ISupplyRepository _supplyRepository;
        private readonly ITransactionRepository _transactionRepository;
        public CreateSupplyHandler(IHttpContextAccessor httpContextAccessor, ISupplyRepository supplyRepository,ITransactionRepository transactionRepository) 
        {
            _httpContextAccessor = httpContextAccessor;
            _supplyRepository = supplyRepository;
            _transactionRepository = transactionRepository;
        }
        public async Task<bool> Handle(CreateSupplyCommand request, CancellationToken cancellationToken)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var currentUserRole = user.FindFirstValue(ClaimTypes.Role);

            if (!string.Equals(currentUserRole, "assistant", StringComparison.OrdinalIgnoreCase))
                throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

            if (string.IsNullOrWhiteSpace(request.SupplyName) || string.IsNullOrWhiteSpace(request.Unit))
                throw new ArgumentException(MessageConstants.MSG.MSG07);

            if (request.QuantityInStock <= 0)
                throw new ArgumentException(MessageConstants.MSG.MSG94);

            if (request.Price <= 0)
                throw new ArgumentException(MessageConstants.MSG.MSG95);

            if (request.ExpiryDate?.Date < DateTime.Today)
                throw new ArgumentException(MessageConstants.MSG.MSG96);

            var existSupply = await _supplyRepository.GetExistSupply(request.SupplyName, request.Price, request.ExpiryDate);
            if (existSupply != null)
            {
                existSupply.QuantityInStock += request.QuantityInStock;
                existSupply.UpdatedAt = DateTime.Now;
                existSupply.UpdatedBy = currentUserId;
                return await _supplyRepository.EditSupplyAsync(existSupply);
            }

            // Create new supply and transaction records
            var newTransaction = new FinancialTransaction
            {
                TransactionDate = DateTime.Now,
                Description = $"Nhập kho vật tư: {request.SupplyName.Trim()}",
                TransactionType = false, // True for chi
                Category = "Vật tư y tế",
                PaymentMethod = true, // True for cash
                Amount = request.Price * request.QuantityInStock,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDelete = false
            };
            var isTransactionCreated = await _transactionRepository.CreateTransactionAsync(newTransaction);
            if (!isTransactionCreated)
                throw new Exception(MessageConstants.MSG.MSG58);

            var newSupply = new Supplies
            {
                Name = request.SupplyName.Trim(),
                Unit = request.Unit,
                QuantityInStock = request.QuantityInStock,
                Price = Math.Round(request.Price, 2),
                ExpiryDate = request.ExpiryDate,
                CreatedAt = DateTime.Now,
                CreatedBy = currentUserId,
                IsDeleted = false
            };
            var isSupplyCreated = await _supplyRepository.CreateSupplyAsync(newSupply);
            return isSupplyCreated;
        }
    }
}
