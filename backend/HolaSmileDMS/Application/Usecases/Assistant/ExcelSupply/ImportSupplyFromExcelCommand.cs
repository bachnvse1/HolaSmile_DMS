using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.ExcelSupply
{
    public class ImportSupplyFromExcelCommand : IRequest<int>
    {
        public IFormFile File { get; set; }
    }

}
