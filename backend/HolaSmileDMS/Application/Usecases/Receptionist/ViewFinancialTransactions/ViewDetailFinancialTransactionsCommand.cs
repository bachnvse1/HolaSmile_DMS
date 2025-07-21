
using MediatR;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ViewDetailFinancialTransactionsCommand : IRequest<ViewFinancialTransactionsDTO>
    {
        public int TransactionId { get; set; }
        public ViewDetailFinancialTransactionsCommand(int transactionId)
        {
            TransactionId = transactionId;
        }
    }
}
