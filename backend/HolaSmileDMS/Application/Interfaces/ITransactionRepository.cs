using Domain.Entities;

namespace Application.Interfaces
{
    public interface ITransactionRepository
    {
        Task<bool> CreateTransactionAsync(FinancialTransaction transaction);
        Task<bool> UpdateTransactionAsync(FinancialTransaction transaction);
        Task<List<FinancialTransaction>> GetAllFinancialTransactionsAsync();
        Task<FinancialTransaction> GetTransactionByIdAsync(int transactionId);
        Task<List<FinancialTransaction>> GetExpenseTransactionsAsync();

    }
}
