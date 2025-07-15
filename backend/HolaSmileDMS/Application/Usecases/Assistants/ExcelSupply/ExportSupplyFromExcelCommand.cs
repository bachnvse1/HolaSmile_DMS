using MediatR;

namespace Application.Usecases.Assistants.ExcelSupply
{
    public class ExportSupplyToExcelCommand : IRequest<byte[]>
    {
    }
}
