using MediatR;

namespace Application.Usecases.Assistant.EditWarrantyCard
{
    public class EditWarrantyCardCommand : IRequest<string>
    {
        public int WarrantyCardId { get; set; }
        public string Term { get; set; } = string.Empty;
        public bool Status { get; set; }
    }
}
