using MediatR;

namespace Application.Usecases.Receptionist.DeactiveFinancialTransaction
{
    public class DeactiveFinancialTransactionCommand : IRequest<bool>
    {
        public int TransactionId { get; set; }
        public DeactiveFinancialTransactionCommand(int transactionId)
        {
            TransactionId = transactionId;
        }
    }
}
