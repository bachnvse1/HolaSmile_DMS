using MediatR;

namespace Application.Usecases.Receptionist.ViewFinancialTransactions
{
    public class ExportTransactionToExcelCommand : IRequest<byte[]>
    {
    }
}
