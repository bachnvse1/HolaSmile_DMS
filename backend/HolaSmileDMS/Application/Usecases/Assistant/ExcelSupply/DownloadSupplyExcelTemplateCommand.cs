using MediatR;

namespace Application.Usecases.Assistant.ExcelSupply
{
    public class DownloadSupplyExcelTemplateCommand : IRequest<byte[]>
    {
    }
}
