using Application.Constants;
using Application.Usecases.Assistant.ViewListWarrantyCards;
using MediatR;
using Microsoft.AspNetCore.Http;

public class ViewListWarrantyCardsHandler : IRequestHandler<ViewListWarrantyCardsCommand, List<ViewWarrantyCardDto>>
{
    private readonly IWarrantyRepository _repository;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public ViewListWarrantyCardsHandler(IWarrantyRepository repository, IHttpContextAccessor httpContextAccessor)
    {
        _repository = repository;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<List<ViewWarrantyCardDto>> Handle(ViewListWarrantyCardsCommand request, CancellationToken cancellationToken)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        var role = user?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (user == null)
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG53);

        if (role != "Assistant" && role != "Patient")
            throw new UnauthorizedAccessException(MessageConstants.MSG.MSG26);

        var cards = await _repository.GetAllWarrantyCardsWithProceduresAsync(cancellationToken);

        return cards.Select(card =>
        {
            var procedure = card.Procedures.FirstOrDefault(); // giả định mỗi card chỉ có 1 thủ thuật

            return new ViewWarrantyCardDto
            {
                WarrantyCardId = card.WarrantyCardID,
                StartDate = card.StartDate,
                EndDate = card.EndDate,
                Term = card.Term,
                Status = card.Status,
                ProcedureId = procedure?.ProcedureId,
                ProcedureName = procedure?.ProcedureName ?? "Không xác định"
            };
        }).ToList();
    }

}
