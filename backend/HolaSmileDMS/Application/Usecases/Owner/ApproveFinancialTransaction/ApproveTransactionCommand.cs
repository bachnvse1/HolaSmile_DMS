using MediatR;

namespace Application.Usecases.Owner.ApproveFinancialTransaction
{
    public class ApproveTransactionCommand : IRequest<bool>
    {
        public int TransactionId { get; set; }
        public bool Action { get; set; } //0 for approve, 1 for reject
    }
}
