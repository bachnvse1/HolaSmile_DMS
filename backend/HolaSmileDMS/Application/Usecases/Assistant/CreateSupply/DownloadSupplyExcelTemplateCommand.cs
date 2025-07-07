using MediatR;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class DownloadSupplyExcelTemplateCommand : IRequest<byte[]>
    {
    }
}
