using MediatR;

namespace Application.Usecases.Assistant.CreateWarrantyCard
{
    public class CreateWarrantyCardCommand : IRequest<CreateWarrantyCardDto>
    {
        public int ProcedureId { get; set; }  
        public string Term { get; set; } = null!;  
    }
}
