using MediatR;

namespace Application.Usecases.Assistant.ExcelSupply
{
    public class ExportSupplyToExcelCommand : IRequest<byte[]>
    {
    }
}
