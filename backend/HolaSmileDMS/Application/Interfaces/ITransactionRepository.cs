using Domain.Entities;

namespace Application.Interfaces
{
    public interface ITransactionRepository
    {
        Task<bool> CreateTransactionAsync(FinancialTransaction transaction);
        Task<bool> CreateSupplyTransactionAsync(SuppliesTransaction suppliesTransaction);
        Task<List<FinancialTransaction>> GetAllFinancialTransactionsAsync();
        Task<FinancialTransaction> GetTransactionByIdAsync(int transactionId);

    }
}
