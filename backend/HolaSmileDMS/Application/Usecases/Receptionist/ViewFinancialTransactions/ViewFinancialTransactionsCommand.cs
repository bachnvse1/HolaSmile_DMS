using MediatR;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ViewFinancialTransactionsCommand : IRequest<List<ViewFinancialTransactionsDTO>>
    {
    }
}
