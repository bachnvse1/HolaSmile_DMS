using Application.Interfaces;
using Domain.Entities;
using HDMS_API.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class TransactionRepository : ITransactionRepository
    {
        private readonly ApplicationDbContext _context;

        public TransactionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateTransactionAsync(FinancialTransaction transaction)
        {
            _context.FinancialTransactions.Add(transaction);
            return await _context.SaveChangesAsync() > 0;
        }
        public async Task<bool> UpdateTransactionAsync(FinancialTransaction transaction)
        {
            _context.FinancialTransactions.Update(transaction);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<List<FinancialTransaction>> GetAllFinancialTransactionsAsync()
        {
            return await _context.FinancialTransactions.Where(t => !t.IsDelete).ToListAsync();
        }

        public async Task<FinancialTransaction> GetTransactionByIdAsync(int transactionId)
        {
            return await _context.FinancialTransactions.FindAsync(transactionId);
        }

        public async Task<List<FinancialTransaction>> GetPendingTransactionsAsync()
        {
            return await _context.FinancialTransactions.Where(t => t.status == "pending" && !t.IsDelete).ToListAsync();
        }
    }
}
