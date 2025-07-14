using MediatR;

namespace Application.Usecases.Assistants.ExcelSupply
{
    public class DownloadSupplyExcelTemplateCommand : IRequest<byte[]>
    {
    }
}
