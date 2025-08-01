using Application.Usecases.Receptionist.ViewFinancialTransactions;
using Domain.Entities;
using MediatR;

namespace Application.Usecases.Owner.ApproveFinancialTransaction
{
    public class ViewListExpenseCommand : IRequest<List<ViewFinancialTransactionsDTO>>
    {
    }
}
