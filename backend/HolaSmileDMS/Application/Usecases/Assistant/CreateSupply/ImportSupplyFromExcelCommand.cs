using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.Usecases.Assistant.CreateSupply
{
    public class ImportSupplyFromExcelCommand : IRequest<int>
    {
        public IFormFile File { get; set; }
    }

}
