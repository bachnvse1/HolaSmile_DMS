using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistants.ExcelSupply
{
    public class ImportSupplyFromExcelCommand : IRequest<int>
    {
        public IFormFile File { get; set; }
    }

}
