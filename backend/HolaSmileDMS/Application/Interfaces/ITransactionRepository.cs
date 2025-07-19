using Domain.Entities;

namespace Application.Interfaces
{
    public interface ITransactionRepository
    {
        Task<bool> CreateTransactionAsync(FinancialTransaction transaction);
        Task<List<FinancialTransaction>> GetAllFinancialTransactionsAsync();
        Task<FinancialTransaction> GetTransactionByIdAsync(int transactionId);

    }
}
