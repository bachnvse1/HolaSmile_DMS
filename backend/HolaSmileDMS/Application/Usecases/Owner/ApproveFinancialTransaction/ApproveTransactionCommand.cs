using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MediatR;

namespace Application.Usecases.Owner.ApproveFinancialTransaction
{
    public class ApproveTransactionCommand : IRequest<bool>
    {
        public int TransactionId { get; set; }
        public ApproveTransactionCommand(int transactionId)
        {
            TransactionId = transactionId;
        }
    }
}
